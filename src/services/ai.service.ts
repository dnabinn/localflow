import type { CompletionUsage } from "openai/resources/completions";
import { getOpenAIClient } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

const DEFAULT_MODEL = "gpt-4o-mini";

interface GenerateCaptionOptions {
  businessName: string;
  tone: string;
  postType: string;
  language?: string;
  context?: string;
  workspaceId?: string;
  businessId?: string;
}

interface GenerateHashtagsOptions {
  caption: string;
  postType: string;
  count?: number;
}

interface GenerateReplyOptions {
  message: string;
  platform: string;
  businessName: string;
  tone?: string;
  language?: string;
  workspaceId?: string;
  businessId?: string;
}

const TONE_DESCRIPTIONS: Record<string, string> = {
  CALM: "calm, serene, peaceful, and inviting",
  LUXURY: "sophisticated, premium, exclusive, and elegant",
  TRADITIONAL: "warm, trustworthy, classic, and community-focused",
  MODERN: "fresh, innovative, trendy, and vibrant",
  FRIENDLY: "warm, approachable, cheerful, and personal",
  PROFESSIONAL: "polished, confident, informative, and credible",
};

export async function generateCaption(options: GenerateCaptionOptions): Promise<string> {
  const {
    businessName, tone, postType, language = "en",
    context = "", workspaceId, businessId,
  } = options;

  const toneDesc = TONE_DESCRIPTIONS[tone] ?? "friendly and engaging";
  const postTypeLabel = postType.replace(/_/g, " ").toLowerCase();

  const prompt = `You are a social media expert for local businesses. Generate a compelling ${postTypeLabel} caption for "${businessName}".

Tone: ${toneDesc}
Language: ${language}
${context ? `Additional context: ${context}` : ""}

Requirements:
- Engaging and authentic to the business type
- Appropriate length for the post type (shorter for Instagram, can be longer for Facebook)
- Ends with a subtle call to action when appropriate
- No placeholder text or brackets
- Just the caption text, nothing else`;

  const completion = await getOpenAIClient().chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    temperature: 0.8,
  });

  const caption = completion.choices[0]?.message?.content?.trim() ?? "";

  if (workspaceId) {
    await logAiUsage({
      workspaceId,
      businessId,
      feature: "caption_generation",
      usage: completion.usage,
    });
  }

  return caption;
}

export async function generateHashtags(options: GenerateHashtagsOptions): Promise<string[]> {
  const { caption, postType, count = 20 } = options;

  const prompt = `Generate ${count} relevant hashtags for this social media ${postType.toLowerCase().replace(/_/g, " ")} caption.

Caption: "${caption}"

Return only the hashtags, one per line, starting with #. No explanations.`;

  const completion = await getOpenAIClient().chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("#"))
    .slice(0, count);
}

export async function generateReply(options: GenerateReplyOptions): Promise<string> {
  const {
    message, platform, businessName, tone = "FRIENDLY",
    language = "en", workspaceId, businessId,
  } = options;

  const toneDesc = TONE_DESCRIPTIONS[tone] ?? "friendly and professional";
  const platformLabel = platform.replace(/_/g, " ").toLowerCase();

  const prompt = `You are responding to a ${platformLabel} review or comment on behalf of "${businessName}".

Customer message: "${message}"

Tone: ${toneDesc}
Language: ${language}

Write a professional, empathetic, and helpful reply that:
- Acknowledges the customer's experience
- Is genuine and not generic
- Stays under 200 words
- Matches the sentiment appropriately
- For negative reviews: is apologetic and offers resolution
- For positive reviews: is grateful and encouraging

Just the reply text, nothing else.`;

  const completion = await getOpenAIClient().chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content?.trim() ?? "";

  if (workspaceId) {
    await logAiUsage({
      workspaceId,
      businessId,
      feature: "reply_generation",
      usage: completion.usage,
    });
  }

  return reply;
}

async function logAiUsage({
  workspaceId,
  businessId,
  feature,
  usage,
}: {
  workspaceId: string;
  businessId?: string;
  feature: string;
  usage: CompletionUsage | undefined;
}) {
  try {
    await prisma.aiUsageLog.create({
      data: {
        workspaceId,
        businessId: businessId ?? null,
        feature,
        promptTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
        model: DEFAULT_MODEL,
      },
    });
  } catch {
    // Non-critical — don't throw
  }
}
