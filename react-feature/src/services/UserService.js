import api from './AuthService';

const REST_API_GET_URL = "/user/get"

export function listUsers(){
    return api.get(REST_API_GET_URL);
}

export function GetUserById(){
    return api.get("/user/get/id/{id}")
}

export function getUserInfo(){
    return api.get("/user/get/{username}");
}

// New User Relations API methods
export const UserRelationsService = {
    // Follow/Unfollow a user
    toggleFollow: (targetUserName) => {
        return api.post(`/user-relations/follow/${targetUserName}`);
    },

    // Check if current user follows target user
    isFollowing: (targetUserName) => {
        return api.get(`/user-relations/is-following/${targetUserName}`);
    },

    // Get paginated followers
    getFollowers: (userName, page = 0, size = 20) => {
        return api.get(`/user-relations/${userName}/followers?page=${page}&size=${size}`);
    },

    // Get paginated following
    getFollowing: (userName, page = 0, size = 20) => {
        return api.get(`/user-relations/${userName}/following?page=${page}&size=${size}`);
    },

    // Get relationship summary
    getRelationshipSummary: (userName) => {
        return api.get(`/user-relations/${userName}/summary`);
    },

    // Get friend suggestions
    getFriendSuggestions: (limit = 10) => {
        return api.get(`/user-relations/suggestions?limit=${limit}`);
    },

    // Backward compatibility - get follower usernames only
    getFollowerUserNames: (userName) => {
        return api.get(`/user-relations/${userName}/followers/usernames`);
    },

    // Backward compatibility - get following usernames only
    getFollowingUserNames: (userName) => {
        return api.get(`/user-relations/${userName}/following/usernames`);
    }
};

// Profile update method
export const updateProfile = (profileData, isFormData = false) => {
    const config = isFormData ? {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    } : {};
    
    return api.patch('/user/update', profileData, config);
};

// Clear current user's notifications
export const clearMyNotifications = () => {
    return api.post('/user/notifications/clear');
};