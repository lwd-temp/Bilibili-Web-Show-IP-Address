import { observeAndInjectComments } from "@/processors/observer"
import { hookBbComment, pageType } from "@/processors/hook"
import { isElementLoaded, startsWithAny } from "@/utils/helper"

const serveNewDynamic = async (itemSelector: string) => {
  await isElementLoaded(itemSelector)
  document.querySelectorAll(".bili-dyn-list__item").forEach(
    async (card) => {
      const commentButton = await isElementLoaded(".bili-dyn-action.comment", card)
      commentButton.addEventListener('click', () => {
        observeAndInjectComments(card as HTMLElement | undefined)
      }, { once: true })
    }
  )
}


export const matchPrefix = async (url: string) => {
  if (startsWithAny(url, [
    "https://www.bilibili.com/video/", // 视频
    "https://www.bilibili.com/list/", // 新列表
    "https://www.bilibili.com/opus/", // 新版单独动态页
    "https://www.bilibili.com/cheese/play/" // 课程页
  ])
  ) {
    observeAndInjectComments()
  } else if (url.startsWith("https://www.bilibili.com/bangumi/play/")) {
    const isNewBangumi = !!document.querySelector("meta[name=next-head-count]")
    if (isNewBangumi) {
      observeAndInjectComments()
    } else {
      hookBbComment(pageType.bangumi)
    }
  } else if (
    url.startsWith("https://www.bilibili.com/v/topic/detail/") // 话题页
  ) {
    hookBbComment(pageType.dynamic)
  } else if (url.startsWith("https://space.bilibili.com/") && url.endsWith("dynamic") // 个人空间动态页
  ) {
    serveNewDynamic(".bili-dyn-list__item")
  } else if (url.startsWith("https://space.bilibili.com/")) { // 个人空间
    const dynamicTab = await isElementLoaded('.n-dynamic')
    dynamicTab.addEventListener('click', () => {
      serveNewDynamic(".bili-dyn-list__item")
    }, { once: true })
  } else if (url.startsWith("https://t.bilibili.com/") && location.pathname === '/') { // 动态主页
    const dynHome = await isElementLoaded('.bili-dyn-home--member')
    const isNewDyn = (dynHome.querySelector('.bili-dyn-sidebar__btn') as HTMLElement | undefined)?.innerText.startsWith("新版反馈")
    if (isNewDyn) {
      const dynList = await isElementLoaded('.bili-dyn-list', dynHome)
      let lastObserved: HTMLElement
      const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
          if (
            mutation.type !== 'childList' ||
            !(mutation.target instanceof HTMLElement) ||
            !mutation.target.classList.contains('bili-comment-container') ||
            mutation.target === lastObserved
          ) continue
          observeAndInjectComments(mutation.target)
          lastObserved = mutation.target
        }
      })
      observer.observe(dynList, { childList: true, subtree: true })
    } else {
      hookBbComment(pageType.dynamic)
    }
  } else if (url.startsWith("https://t.bilibili.com/")) { // 单独动态页
    const dynItem = await isElementLoaded('.bili-dyn-item')
    const isNewDyn = !!dynItem.querySelector('.bili-comment-container')
    if (isNewDyn) {
      const commentContainer = await isElementLoaded('.bili-comment-container', dynItem) as HTMLElement
      observeAndInjectComments(commentContainer)
    } else {
      hookBbComment(pageType.dynamic)
    }
  }
}

