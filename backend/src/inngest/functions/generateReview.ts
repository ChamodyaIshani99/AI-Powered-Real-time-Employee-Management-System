// ---------------------------------------------------------------------------
// OpenAI API helper
// ---------------------------------------------------------------------------

interface AIRating {
  category: string;
  score: number;
  comment: string;
}

interface AIReviewResult {
  overallScore: number;
  strengths: string;
  improvements: string;
  summary: string;
}

async function callOpenAI(prompt: string): Promise<AIReviewResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      input: prompt,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI API error (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as {
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  let text = "";

  for (const output of data.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && content.text) {
        text += content.text;
      }
    }
  }

  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("OpenAI response did not contain valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  if (
    typeof parsed.overallScore !== "number" ||
    typeof parsed.strengths !== "string" ||
    typeof parsed.improvements !== "string" ||
    typeof parsed.summary !== "string"
  ) {
    throw new Error("OpenAI response missing required fields");
  }

  return {
    overallScore: Math.min(5, Math.max(1, parsed.overallScore)),
    strengths: parsed.strengths,
    improvements: parsed.improvements,
    summary: parsed.summary,
  };
}

// ---------------------------------------------------------------------------
// Build the prompt for Gemini
// ---------------------------------------------------------------------------

function buildReviewPrompt(params: {
  employeeName: string;
  department: string;
  period: string;
  ratings: AIRating[];
  previousReviews: string;
}): string {
  const ratingsText = params.ratings
    .map(
      (r) =>
        `- ${r.category}: ${r.score}/5${r.comment ? ` — "${r.comment}"` : ""}`,
    )
    .join("\n");

  return `You are an expert HR performance review analyst. Generate a comprehensive performance review based on the following data.

## Employee Information
- Name: ${params.employeeName}
- Department: ${params.department}
- Review Period: ${params.period}

## Category Ratings
${ratingsText}

${params.previousReviews}

## Instructions
Based on the ratings and any available history, generate a structured performance review. Be specific, constructive, and professional.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "overallScore": <number 1-5, weighted average based on category importance>,
  "strengths": "<2-3 sentence paragraph highlighting the employee's key strengths based on their high-scoring areas>",
  "improvements": "<2-3 sentence paragraph with specific, actionable improvement suggestions based on lower-scoring areas>",
  "summary": "<3-4 sentence overall narrative that ties together performance across all categories, suitable for a formal review document>"
}

Rules:
- overallScore should be a thoughtful weighted average (not just a simple mean), considering that technical skills and leadership may carry different weight depending on the department
- Be specific to the employee's actual scores — don't give generic feedback
- Keep the tone professional and constructive
- Do NOT include any text outside the JSON object`;
}

// ---------------------------------------------------------------------------
// Inngest function: generate-review
// ---------------------------------------------------------------------------

type StepRunner = {
  run<T>(name: string, fn: () => Promise<T>): Promise<T>;
};

const directStep: StepRunner = {
  async run<T>(_name: string, fn: () => Promise<T>): Promise<T> {
    return await fn();
  },
};

export async function generateReviewDirect(
  reviewId: string
) {
  const step = directStep;

    // Step 1: Fetch the review document with populated references.
    const reviewData = await step.run("fetch-review", async () => {
      const { PerformanceReview } =
        await import("../../models/PerformanceReview.js");
      const { User } = await import("../../models/User.js");

      const review = await PerformanceReview.findById(reviewId)
        .populate("employee", "name email department")
        .populate("reviewer", "name email");

      if (!review) {
        throw new Error(`Review ${reviewId} not found`);
      }

      const employee = review.employee as unknown as {
        _id: { toString(): string };
        name: string;
        email: string;
        department?: { name: string } | null;
      };

      const departmentName =
        employee.department && typeof employee.department === "object"
          ? employee.department.name
          : "Unassigned";

      return {
        employeeName: employee.name,
        department: departmentName,
        period: review.period,
        ratings: review.ratings.map((r) => ({
          category: r.category,
          score: r.score,
          comment: r.comment || "",
        })),
      };
    });

    // Step 2: Fetch previous reviews for context.
    const previousReviews = await step.run(
      "fetch-previous-reviews",
      async () => {
        const { PerformanceReview } =
          await import("../../models/PerformanceReview.js");

        const employee = await (
          await import("../../models/PerformanceReview.js")
        ).PerformanceReview.findById(reviewId).select("employee");

        if (!employee) return "";

        const past = await PerformanceReview.find({
          employee: employee.employee,
          _id: { $ne: reviewId },
          summary: { $exists: true, $ne: "" },
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .select("period overallScore summary")
          .lean();

        if (past.length === 0) return "";

        const historyText = past
          .map(
            (r) =>
              `- ${r.period}: Overall ${r.overallScore ?? "N/A"}/5 — "${r.summary}"`,
          )
          .join("\n");

        return `\n## Previous Review History\n${historyText}`;
      },
    );

    // Step 3: Call Gemini AI to generate the review.
    const aiResult = await step.run("generate-ai-review", async () => {
      const prompt = buildReviewPrompt({
        employeeName: reviewData.employeeName,
        department: reviewData.department,
        period: reviewData.period,
        ratings: reviewData.ratings,
        previousReviews,
      });

      return callOpenAI(prompt);
    });

    // Step 4: Update the review document with AI-generated content.
    await step.run("save-review", async () => {
      const { PerformanceReview } =
        await import("../../models/PerformanceReview.js");

      await PerformanceReview.findByIdAndUpdate(reviewId, {
        overallScore: aiResult.overallScore,
        strengths: aiResult.strengths,
        improvements: aiResult.improvements,
        summary: aiResult.summary,
        aiGenerated: true,
        status: "pending_acknowledgment",
      });
    });

    // Step 5: Notify the employee.
    await step.run("notify-employee", async () => {
      const { PerformanceReview } =
        await import("../../models/PerformanceReview.js");
      const { notify } = await import("../../lib/notifications.js");
      const { pushToUsers, createEvent } = await import("../../lib/sse.js");

      const review = await PerformanceReview.findById(reviewId).populate(
        "employee reviewer",
        "name",
      );
      if (!review) return;

      const employee = review.employee as unknown as {
        _id: import("mongoose").Types.ObjectId;
        name: string;
      };
      const reviewer = review.reviewer as unknown as { _id: import("mongoose").Types.ObjectId; name: string };

      notify({
        recipient: employee._id,
        type: "review_assigned",
        title: "Performance review ready",
        message: `Your ${review.period} performance review by ${reviewer.name} is ready for your review.`,
        link: "/performance-reviews",
        data: {
          period: review.period,
          reviewerName: reviewer.name,
          overallScore: aiResult.overallScore,
        },
      });

      // Real-time SSE push to employee and reviewer
      pushToUsers(
        [employee._id.toString(), reviewer._id.toString()],
        createEvent("review-ready", {
          reviewId,
          period: review.period,
          overallScore: aiResult.overallScore,
          employeeName: employee.name,
        })
      );
    });

      return {
    reviewId,
    overallScore: aiResult.overallScore,
    status: "pending_acknowledgment",
  };
}
