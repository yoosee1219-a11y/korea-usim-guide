export interface Translation {
  common: {
    viewCount: string;
    readMore: string;
    previous: string;
    next: string;
    all: string;
    share: string;
    backToList: string;
    loading: string;
  };
  nav: {
    compare: string;
    tips: string;
  };
  home: {
    badge: string;
    hero: {
      title1: string;
      title2: string;
      description: string;
      compareButton: string;
      tipsButton: string;
    };
    features: {
      title: string;
      description: string;
      easyComparison: {
        title: string;
        description: string;
      };
      verifiedTips: {
        title: string;
        description: string;
      };
      fastReliable: {
        title: string;
        description: string;
      };
    };
    latestTips: {
      title: string;
      description: string;
      viewAll: string;
    };
    cta: {
      title: string;
      description: string;
      button: string;
    };
  };
  tips: {
    title: string;
    description: string;
    category: string;
    featured: string;
    allTips: string;
    noTips: string;
  };
  tipDetail: {
    notFound: {
      title: string;
      description: string;
      button: string;
    };
    readTime: string;
    helpful: string;
    relatedTips: string;
    linkCopied: string;
  };
  footer: {
    description: string;
    menu: string;
    legal: string;
    privacy: string;
    terms: string;
    contact: string;
    copyright: string;
  };
}
