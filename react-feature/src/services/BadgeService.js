class BadgeService {
  static getBadgeInfo(type) {
    switch (type) {
      case 'FIRST_100':
        return { icon: '👑', label: 'First 100', color: '#FFD700', description: 'One of the first 100 users to join FeatureMe!' };
      case 'VIP':
        return { icon: '💎', label: 'VIP', color: '#9B59B6', description: 'Premium VIP member with exclusive access!' };
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
        return { icon: '👨‍💼', label: 'CEO/Founder', color: '#D4AF37', description: 'Founder and CEO of FeatureMe!' };
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
      '100_FOLLOWERS'
    ];
  }
}

export default BadgeService;
