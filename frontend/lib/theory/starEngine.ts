import type { ChapterResult, ChapterResultInput } from "./types";

export function calculateChapterResult(input: ChapterResultInput): ChapterResult {
  const { correctCount, totalCount, previousBestStars = 0 } = input;
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

  let currentStars: 0 | 1 | 2 | 3 = 0;
  if (accuracy >= 0.8) currentStars = 3;
  else if (accuracy >= 0.5) currentStars = 2;
  else if (accuracy > 0) currentStars = 1;

  const stars = Math.max(currentStars, previousBestStars) as 0 | 1 | 2 | 3;
  const passed = currentStars >= 2 || stars >= 2;

  return {
    accuracy: Number(accuracy.toFixed(4)),
    stars,
    passed,
    unlockNext: passed,
    message: getChapterMessage(currentStars, accuracy),
  };
}

function getChapterMessage(stars: 0 | 1 | 2 | 3, accuracy: number): string {
  if (stars === 3) return "太棒啦，三星通过！";
  if (stars === 2) return "通过啦，下一关已解锁！";
  if (accuracy > 0) return "已经有进步了，再练一次就能过关。";
  return "先别急，回到教学关再看一遍。";
}

export function calculateModuleReward(params: { earnedStars: number; totalStars: number }) {
  const ratio = params.totalStars > 0 ? params.earnedStars / params.totalStars : 0;
  return {
    ratio: Number(ratio.toFixed(4)),
    unlocked: ratio >= 0.85,
    rewardType: ratio >= 0.85 ? "gold_border_and_animation" : "none",
    message: ratio >= 0.85 ? "本门类星星已达到85%，解锁金色边框和庆祝动画！" : "继续收集星星，可以解锁金色奖励。",
  };
}

export function getTotalStarsByModule(chapterCount: number) {
  return chapterCount * 3;
}
