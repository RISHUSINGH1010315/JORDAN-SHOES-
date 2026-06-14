// Jordan Auth & Database Engine

const USER_DB_KEY = 'jordan_users';
const SESSION_KEY = 'jordan_session';

// Helper to hash password using SHA-256 via Web Crypto API
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get all users from local storage database
function getUsers() {
  const usersJson = localStorage.getItem(USER_DB_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}

// Save all users to local storage database
function saveUsers(users) {
  localStorage.setItem(USER_DB_KEY, JSON.stringify(users));
}

// Core Auth Controller
const JordanAuth = {
  // Register a new user
  async register(username, email, password) {
    const users = getUsers();
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email address is already registered.');
    }
    
    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username is already taken.');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format.');
    }
    
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character.');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create new user object
    const newUser = {
      username,
      email,
      password: hashedPassword,
      profile: {
        name: username.toUpperCase(),
        size: '10.5',
        bio: 'Sneaker collector and part of the Jordan family.',
        email: email,
        avatarUrl: ''
      },
      orders: [
        // Pre-populate with a demo order for realism
        {
          id: 'JD-' + Math.floor(10000 + Math.random() * 90000),
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          status: 'COMPLETED',
          price: 194.40,
          item: "Air Jordan 1 Retro High OG (Chicago / Black / White)"
        }
      ],
      wardrobe: [
        // Pre-populate with a demo pair
        {
          name: "Air Jordan 1 'University Blue'",
          date: "May 2026",
          tag: "LIMIT DROP",
          imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRmycPzeBDlm0iNN62pl8-SMwrmslJOGp7P-XZb3bfJI9mAMOZEnaGPk27qalTn1enzonOSkYRgJPT9u0zLmD0D3Ie4t0xVwldxZLCXUVQrXrsxmsE5bFSX3lL2cBMY3YTJTRuWq7DYTDpqFYeyjySZj5KKD0UcDJ6_i6yIcVz7F3-8Uv6m9pCWyhKHISQG2IaBH0T5xMBn8wA_l8WL8eixaOOnNIkxqbZvZWGbcSkyDw3-OD9wnlxkthZjVUZ0cLH2Bva-cCTRzQG"
        }
      ]
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Auto-login after registration
    this.setSession(newUser);
    return newUser;
  },
  
  // Login verification
  async login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('Invalid email or password.');
    }
    
    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) {
      throw new Error('Invalid email or password.');
    }
    
    this.setSession(user);
    return user;
  },
  
  // Set current user session
  setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
  },
  
  // Logout
  logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'Login.html';
  },
  
  // Get currently logged-in user
  getCurrentUser() {
    const sessionJson = localStorage.getItem(SESSION_KEY);
    if (!sessionJson) return null;
    
    const session = JSON.parse(sessionJson);
    const users = getUsers();
    return users.find(u => u.email.toLowerCase() === session.email.toLowerCase()) || null;
  },
  
  // Update currently logged-in user's profile
  updateProfile(profileData) {
    const sessionJson = localStorage.getItem(SESSION_KEY);
    if (!sessionJson) throw new Error('No active session found.');
    
    const session = JSON.parse(sessionJson);
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === session.email.toLowerCase());
    
    if (userIndex === -1) throw new Error('User not found.');
    
    users[userIndex].profile = {
      ...users[userIndex].profile,
      ...profileData
    };
    
    saveUsers(users);
    return users[userIndex].profile;
  },

  // Update wardrobe or add sneaker
  addSneakerToWardrobe(sneaker) {
    const sessionJson = localStorage.getItem(SESSION_KEY);
    if (!sessionJson) return;
    
    const session = JSON.parse(sessionJson);
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === session.email.toLowerCase());
    
    if (userIndex === -1) return;
    
    // Check if already in wardrobe
    if (!users[userIndex].wardrobe) {
      users[userIndex].wardrobe = [];
    }
    
    if (!users[userIndex].wardrobe.some(s => s.name === sneaker.name)) {
      users[userIndex].wardrobe.push(sneaker);
      saveUsers(users);
    }
  }
};

window.JordanAuth = JordanAuth;
export default JordanAuth;
