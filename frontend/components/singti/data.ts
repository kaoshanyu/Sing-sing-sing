// ===== SingTI Personality Data =====

export interface Personality {
  id: number
  name: string
  tagline: string
  description: string
  dims: [0 | 1, 0 | 1, 0 | 1, 0 | 1] // [外放/内敛, 严谨/随性, 感性/理性, 掌控/即兴]
}

export const PERSONALITIES: Personality[] = [
  {
    id: 1,
    name: '音准稽查官',
    tagline: '你唱的不是歌，是精准度',
    description: '你唱歌像在执法。别人唱歌要钱，你唱歌要命——每一个走音都逃不过你的耳朵。KTV里你是行走的调音器，你一张嘴，包间安静得能听见针掉在地上。朋友说你像在唱听力考试，你说这叫专业素养。和你合唱是种修行，因为你会认真复盘每一个人的每一个音。',
    dims: [0, 0, 1, 0], // 外放,严谨,理性,掌控
  },
  {
    id: 2,
    name: '即兴拆迁队',
    tagline: '原曲是什么？我没听过',
    description: '原旋律到你嘴里就是一顿爆改。《小星星》能让你唱成 Dubstep Remix，《生日快乐》能改成爵士版。好不好听是概率问题，但一定很热闹是你的确定性。朋友们最大的愿望是听你好好唱完一次，而你的回答永远是：不可能，那多无聊。',
    dims: [0, 0, 1, 1], // 外放,严谨,理性,即兴
  },
  {
    id: 3,
    name: '人形指挥台',
    tagline: '你的节奏，就是世界的节奏',
    description: '你唱歌像在指挥交响乐，每个字都有它的位置。跟你合唱的人自动进入你的节奏，因为不跟就会被你的气场碾压。你不是在唱歌，是在展示领导力。哪怕你在浴室里唱，花洒都得按你的拍子出水。',
    dims: [0, 0, 0, 0], // 外放,严谨,感性,掌控
  },
  {
    id: 4,
    name: 'KTV气氛组组长',
    tagline: '你来KTV不是为了唱，是为了主持',
    description: '你不是来唱歌的，是来主持的。你点的歌都是大家会唱的，因为你的终极目标是全场大合唱。你的KPI不是唱了多少首，而是热了多少次场。话筒在你手上待不过三秒，因为你忙着递给别人。你的快乐来源不是自己的歌声，是看到别人唱嗨了。',
    dims: [0, 0, 0, 1], // 外放,严谨,感性,即兴
  },
  {
    id: 5,
    name: '人间小太阳',
    tagline: '你唱什么不重要，你开心最重要',
    description: '你一开口，整个房间的空气都开始蹦迪。你唱什么不重要，重要的是你在唱——而且唱得很开心。你的歌单可能是车祸现场，但没有人忍心打断你，因为你的快乐太有感染力了。你是行走的多巴胺注射器，歌声自带快乐传播属性。',
    dims: [0, 1, 1, 0], // 外放,随性,理性,掌控
  },
  {
    id: 6,
    name: '灵魂共鸣机',
    tagline: '你不是在唱歌，是在替别人唱出心里话',
    description: '你唱歌不是为了炫技，是为了让某个人在某一秒觉得「这首歌就是唱给我的」。你的声音有魔力，唱完别人会说：我被理解了。你是人群中的情感路由器，三流的唱功搭配一流的共情能力，结果往往比技术流更动人。',
    dims: [0, 1, 1, 1], // 外放,随性,理性,即兴
  },
  {
    id: 7,
    name: '歌单收藏家',
    tagline: '你的歌单三千首，能唱全的没几首',
    description: '你的歌单三千首，横跨民谣到重金属。你唱歌的风格取决于今天的心情，而你一天有一百八十种心情。别人问你会唱什么，你说：你点，我都会。其实没几首能唱完整——但没关系，每首歌的前奏你都是王者。',
    dims: [0, 1, 0, 0], // 外放,随性,感性,掌控
  },
  {
    id: 8,
    name: '节奏打印机',
    tagline: '你的准度是99.9%，但0.1%的灵魂去哪了',
    description: '你唱歌比节拍器还准，但比节拍器还无聊。每一个音都踩在点上，每一个字都不差毫厘。你唱《小星星》能唱出校音器的精准度，但就是少了点人味儿。太完美的东西往往没有灵魂——不过你不在乎，因为你本来就是来考试的。',
    dims: [0, 1, 0, 1], // 外放,随性,感性,即兴
  },
  {
    id: 9,
    name: '声乐研究员',
    tagline: '你研究声乐的时间是练歌时间的十倍',
    description: '你知道什么叫胸声混声头声边缘化，你知道自己的音域精确到半音，你能对着一个音分析十分钟的发声原理。但你唱不完整一首歌——因为你觉得没必要。你研究声乐的时间是练歌时间的十倍，你是行走的声乐维基百科。问题是：维基百科不能上台表演。',
    dims: [1, 0, 1, 0], // 内敛,严谨,理性,掌控
  },
  {
    id: 10,
    name: '卧室录音师',
    tagline: '录一首歌的时间够别人录一张专辑',
    description: '你录一首歌的时间够别人录一张专辑。唱错一个字？重来。气息不稳？重来。你觉得完美了，发到朋友圈，别人评论：跟原唱差不多——你觉得这是对你最大的侮辱。你的目标是超越原唱，你的现状是永远在录第一句。',
    dims: [1, 0, 1, 1], // 内敛,严谨,理性,即兴
  },
  {
    id: 11,
    name: '音乐解构者',
    tagline: '你是音乐圈的评论家，不是运动员',
    description: '你听过一万首歌，分析过每一个和弦走向。你能说出任何一个流行歌的调式、节奏型、制作手法。但别人让你唱一首，你说：我研究的是音乐，不是演唱。你的骄傲不是唱得好不好，而是懂不懂。你是音乐圈的评论家，不是运动员。',
    dims: [1, 0, 0, 0], // 内敛,严谨,感性,掌控
  },
  {
    id: 12,
    name: '温柔点唱机',
    tagline: '你是一个被唱歌耽误的情感电台主播',
    description: '你从不主动抢麦，但当话筒递到你手上，你的声音会让全场安静。你的歌单里全是别人的故事——你只是替他们唱出来。你像深夜电台的主持人，唱完一首歌，有人眼眶红了，有人低头看手机假装没被击中。',
    dims: [1, 0, 0, 1], // 内敛,严谨,感性,即兴
  },
  {
    id: 13,
    name: '黄昏氛围组',
    tagline: '你在浴室里的表现可以拿格莱美——可惜没人听到',
    description: '你唱歌需要三样东西：合适的灯光、合理的温度、没有人在场。你在浴室里的表现可以拿格莱美——但没有一个人有机会听到。你的歌声和你的社恐程度成正比：越没人听得见，你唱得越好。你的个人演唱会的观众永远是花洒和浴巾。',
    dims: [1, 1, 1, 0], // 内敛,随性,理性,掌控
  },
  {
    id: 14,
    name: '隐形主唱',
    tagline: '朋友圈隐藏BOSS，大招CD是社交障碍发作频率',
    description: '你不轻易开口，但一开口就是暴击。平时是社恐，一拿麦克风像被魂穿了。唱完又默默坐回角落假装无事发生，深藏功与名。你是朋友圈里那个「原来你唱歌这么好听」的隐藏BOSS。你的大招CD时间是：社交障碍发作频率。',
    dims: [1, 1, 1, 1], // 内敛,随性,理性,即兴
  },
  {
    id: 15,
    name: '浴室艺术家',
    tagline: '通往客厅的路比通往格莱美还难走',
    description: '你的个人演唱会在浴室每天准时开演。花洒是观众，浴巾是战袍，沐浴露瓶是你的御用伴奏。关上浴室门的一瞬间，你觉得自己可以开世界巡回。你最大的梦想是有朝一日能当着别人的面唱出浴室里的水平——但通往客厅的这段路，比通往格莱美还难走。',
    dims: [1, 1, 0, 0], // 内敛,随性,感性,掌控
  },
  {
    id: 16,
    name: '流浪歌者',
    tagline: '你的伴奏哥们很想哭',
    description: '你唱歌从来不看歌单，一切随缘。开口前你也不知道自己要唱什么，更不知道要唱哪个调。你的每一次演唱都是一场冒险——你永远不知道下一句是升调还是降调，甚至不知道下一句是唱还是念。你的自由令人羡慕，你的伴奏哥们很想哭。',
    dims: [1, 1, 0, 1], // 内敛,随性,感性,即兴
  },
]

// ===== Questions =====
// Each directional question (Q1-Q4) maps to one of the 4 dimensions
// Each voting question (Q5-Q16) also maps to one dimension

export interface Question {
  id: number
  text: string
  optionA: string
  optionB: string
  dim: 0 | 1 | 2 | 3  // which dimension this tests
  dirWeight?: boolean  // true = directional (Q1-Q4)
}

export const QUESTIONS: Question[] = [
  // Q1-Q4: Directional (weighted more heavily)
  {
    id: 1,
    text: '你去 KTV 第一件事是？',
    optionA: '冲到点歌台翻热门榜，先点一排再说',
    optionB: '先看看别人唱什么，观察一下氛围',
    dim: 0,
    dirWeight: true,
  },
  {
    id: 2,
    text: '你学一首新歌的方式是？',
    optionA: '对着歌词一句句抠音准和节奏，练熟了才敢唱',
    optionB: '听两遍直接上，差不多就行了，反正又不是考试',
    dim: 1,
    dirWeight: true,
  },
  {
    id: 3,
    text: '别人说你唱走音了，你第一反应是？',
    optionA: '有点不好意思，但管他的，开心就好',
    optionB: '不可能，你放原唱我对比一下',
    dim: 2,
    dirWeight: true,
  },
  {
    id: 4,
    text: '你的歌单习惯是？',
    optionA: '有固定的几首拿手曲目，反复练到形成肌肉记忆',
    optionB: '随缘，最近刷到什么唱什么，歌单每周大换血',
    dim: 3,
    dirWeight: true,
  },
  // Q5-Q16: Voting
  {
    id: 5,
    text: '你在浴室里的表现和在外面相比？',
    optionA: '浴室歌神，出来秒变路人',
    optionB: '差别不大，在哪里都是这个水平',
    dim: 0,
  },
  {
    id: 6,
    text: '唱《小星星》时你会？',
    optionA: '严格按照原版旋律和节奏，一个字不差',
    optionB: '不自觉就开始加花转调变节奏，原版是啥来着',
    dim: 1,
  },
  {
    id: 7,
    text: '你听歌时更容易被什么击中？',
    optionA: '歌词——这首歌写的不就是我吗',
    optionB: '编曲——这个转音太牛了',
    dim: 2,
  },
  {
    id: 8,
    text: '别人夸你唱歌好听，你一般？',
    optionA: '开心接受，趁热打铁再来一首',
    optionB: '没有啦没有啦，然后火速转移话题',
    dim: 3,
  },
  {
    id: 9,
    text: '如果要录一首歌发朋友圈，你需要录几遍？',
    optionA: '录到满意为止，一个字不对都重来',
    optionB: '一遍过，差不多就发，谁还逐帧听啊',
    dim: 1,
  },
  {
    id: 10,
    text: '你觉得自己唱得最好的时候是？',
    optionA: '唱慢歌，情绪完全进去的时候',
    optionB: '唱快歌，一个转音飙上去的时候',
    dim: 2,
  },
  {
    id: 11,
    text: 'KTV 里话筒一般在你手上多久？',
    optionA: '握着就不放了，我就是麦霸',
    optionB: '唱完赶紧递出去，怕冷场也怕被点名',
    dim: 0,
  },
  {
    id: 12,
    text: '对于「降调」这件事你的态度是？',
    optionA: '降调是对这首歌的不尊重，必须原调',
    optionB: '降几个调无所谓，唱得舒服比什么都重要',
    dim: 3,
  },
  {
    id: 13,
    text: '你看《歌手》这类节目时更关注？',
    optionA: '哪个歌手把我唱哭了',
    optionB: '哪个歌手这期走音了',
    dim: 2,
  },
  {
    id: 14,
    text: '有人突然递话筒让你唱一首，你内心是？',
    optionA: '终于到我了！我最近那首练好了',
    optionB: '完了完了完了，大脑一片空白',
    dim: 0,
  },
  {
    id: 15,
    text: '对于「走音」的容忍度是？',
    optionA: '走音怎么了？感情到了那都不叫走音',
    optionB: '零容忍。走音比走光还严重',
    dim: 1,
  },
  {
    id: 16,
    text: '你理想中的唱歌场景是？',
    optionA: '舞台/聚光灯下/一群人面前',
    optionB: '一个人的深夜/浴室/无人角落',
    dim: 0,
  },
]

// ===== Scoring Logic =====

export interface SingTIAnswers {
  answers: Record<number, 'A' | 'B'> // question_id -> A or B
  voiceIsLoud: boolean // true = loud/confident, false = quiet/shaky
}

export function calculateSingTI(input: SingTIAnswers): Personality {
  const scores = new Map<number, number>() // personality_id -> score
  PERSONALITIES.forEach((p) => scores.set(p.id, 0))

  // Process each question
  for (const q of QUESTIONS) {
    const answer = input.answers[q.id]
    if (!answer) continue

    const points = q.dirWeight ? 2 : 1
    const chosenSide = answer === 'A' ? 0 : 1

    for (const p of PERSONALITIES) {
      if (p.dims[q.dim] === chosenSide) {
        scores.set(p.id, (scores.get(p.id) || 0) + points)
      }
    }
  }

  // Voice analysis bonus
  for (const p of PERSONALITIES) {
    if (input.voiceIsLoud && p.dims[0] === 0) {
      scores.set(p.id, (scores.get(p.id) || 0) + 1)
    } else if (!input.voiceIsLoud && p.dims[0] === 1) {
      scores.set(p.id, (scores.get(p.id) || 0) + 1)
    }
  }

  // Find the personality with the highest score
  let winner: Personality | null = null
  let highestScore = -1
  for (const p of PERSONALITIES) {
    const score = scores.get(p.id) || 0
    if (score > highestScore) {
      highestScore = score
      winner = p
    }
  }

  return winner || PERSONALITIES[0]
}
