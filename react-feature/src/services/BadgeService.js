class BadgeService {
  static getBadgeInfo(type) {
    switch (type) {
      case 'FIRST_100':
        return { icon: '👨‍💼', label: 'First 100', color: '#FFD700', description: 'One of the first 100 users to join FeatureMe!' };
      case 'VIP':
        return { icon: '💎', label: 'VIP', color: '#9B59B6', description: 'Premium VIP member!' };
      case 'TOP_CREATOR':
        return { icon: '🌟', label: 'Top Creator', color: '#F39C12', description: 'Recognized as a top content creator!' };
      case 'VERIFIED':
        return { icon: '✅', label: 'Verified', color: '#27AE60', description: 'Verified user with authentic profile!' };
      case 'EARLY_ADOPTER':
        return { icon: '🚀', label: 'Early Adopter', color: '#E74C3C', description: 'Joined FeatureMe in its early days!' };
      case '100_POSTS':
        return { icon: '💯', label: '100 Posts', color: '#3498DB', description: 'Published 100+ amazing posts!' };
      case '50_POSTS':
        return { icon: '🎯', label: '50 Posts', color: '#2ECC71', description: 'Published 50+ quality posts!' };
      case '25_POSTS':
        return { icon: '📝', label: '25 Posts', color: '#F1C40F', description: 'Published 25+ posts!' };
      case '10_POSTS':
        return { icon: '✍️', label: '10 Posts', color: '#95A5A6', description: 'Published 10+ posts!' };
      case '1000_FOLLOWERS':
        return { icon: '🔥', label: '1000 Followers', color: '#E67E22', description: 'Reached 1000+ followers!' };
      case '500_FOLLOWERS':
        return { icon: '⭐', label: '500 Followers', color: '#8E44AD', description: 'Reached 500+ followers!' };
      case '100_FOLLOWERS':
        return { icon: '🎉', label: '100 Followers', color: '#16A085', description: 'Reached 100+ followers!' };
      case 'SYSTEM':
        return { icon: '🤖', label: 'System', color: '#6C7B7F', description: 'The System!' };
      case 'CEO_FOUNDER':
        return { icon: '👑', label: 'CEO/Founder', color: '#D4AF37', description: 'Founder and CEO of FeatureMe!' };
      case 'FOUNDING_CREATOR':
        return { icon: '🎨', label: 'Founding Creator', color: '#E91E63', description: 'One of the first creators to join FeatureMe!' };
      case 'COLLAB_CHAMPION':
        return { icon: '🤝', label: 'Collab Champion', color: '#FF5722', description: 'Completed 5+ successful collaborations!' };
      case 'VERSE_MASTER':
        return { icon: '🎤', label: 'Verse Master', color: '#9C27B0', description: 'Featured on multiple tracks!' };
      case 'BEAT_MAKER':
        return { icon: '🎵', label: 'Beat Maker', color: '#3F51B5', description: 'Created beats that got featured!' };
      case 'SOCIAL_BUTTERFLY':
        return { icon: '🦋', label: 'Social Butterfly', color: '#00BCD4', description: 'Active in community discussions!' };
      case 'RISING_STAR':
        return { icon: '⭐', label: 'Rising Star', color: '#FF9800', description: 'Fast-growing creator with potential!' };
      case 'COMMUNITY_BUILDER':
        return { icon: '🏗️', label: 'Community Builder', color: '#4CAF50', description: 'Helped grow the FeatureMe community!' };
      case 'TIKTOK_FEATURED':
        return { icon: '📱', label: 'TikTok Featured', color: '#FF1744', description: 'Featured in Post of the Day on TikTok!' };
      case 'REDDIT_WINNER':
        return { icon: '🏆', label: 'Reddit Winner', color: '#FF6F00', description: 'Won a Reddit collaboration challenge!' };
      case 'EARLY_COLLABORATOR':
        return { icon: '🚀', label: 'Early Collaborator', color: '#673AB7', description: 'Participated in early platform collabs!' };
      case 'QUALITY_CONTRIBUTOR':
        return { icon: '💎', label: 'Quality Contributor', color: '#795548', description: 'Consistently high-quality submissions!' };
      case 'MENTOR':
        return { icon: '👨‍🏫', label: 'Mentor', color: '#607D8B', description: 'Helped other creators improve their craft!' };
      default:
        return { icon: '🏆', label: 'Achievement', color: '#34495E', description: 'Special achievement unlocked!' };
    }
  }

  static getAllBadgeTypes() {
    return [
      'FIRST_100',
      'VIP', 
      'TOP_CREATOR',
      'VERIFIED',
      'EARLY_ADOPTER',
      '100_POSTS',
      '50_POSTS',
      '25_POSTS',
      '10_POSTS',
      '1000_FOLLOWERS',
      '500_FOLLOWERS',
      '100_FOLLOWERS',
      'SYSTEM',
      'CEO_FOUNDER',
      'FOUNDING_CREATOR',
      'COLLAB_CHAMPION',
      'VERSE_MASTER',
      'BEAT_MAKER',
      'SOCIAL_BUTTERFLY',
      'RISING_STAR',
      'COMMUNITY_BUILDER',
      'TIKTOK_FEATURED',
      'REDDIT_WINNER',
      'EARLY_COLLABORATOR',
      'QUALITY_CONTRIBUTOR',
      'MENTOR'
    ];
  }
}

export default BadgeService;
