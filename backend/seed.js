const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Place = require('./models/Place');
const Community = require('./models/Community');
const CommunityMessage = require('./models/CommunityMessage');
const Poll = require('./models/Poll');
const PollOption = require('./models/PollOption');
const PollVote = require('./models/PollVote');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Loyola College coordinates
const LOYOLA_COLLEGE_COORDS = {
  latitude: 13.0650,
  longitude: 80.2533
};

// Helper function to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Place.deleteMany();
    await Community.deleteMany();
    await CommunityMessage.deleteMany();
    await Poll.deleteMany();
    await PollOption.deleteMany();
    await PollVote.deleteMany();

    console.log('Data destroyed...');

    // Create users with hashed passwords
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@foodconnect.com',
        passwordHash: await hashPassword('admin123'),
        role: 'admin'
      },
      {
        name: 'John Student',
        email: 'john@student.com',
        passwordHash: await hashPassword('student123'),
        preferences: {
          vegFlag: false,
          cuisines: ['Chinese', 'Italian'],
          budgetRange: { min: 50, max: 300 }
        }
      },
      {
        name: 'Priya Kumar',
        email: 'priya@student.com',
        passwordHash: await hashPassword('student123'),
        preferences: {
          vegFlag: true,
          cuisines: ['South Indian', 'Chinese'],
          budgetRange: { min: 30, max: 200 }
        }
      },
      {
        name: 'Rahul Sharma',
        email: 'rahul@student.com',
        passwordHash: await hashPassword('student123'),
        preferences: {
          vegFlag: false,
          cuisines: ['North Indian', 'Mughlai'],
          budgetRange: { min: 100, max: 500 }
        }
      },
      {
        name: 'Anjali Patel',
        email: 'anjali@student.com',
        passwordHash: await hashPassword('student123'),
        preferences: {
          vegFlag: true,
          cuisines: ['Street Food', 'South Indian'],
          budgetRange: { min: 20, max: 150 }
        }
      }
    ]);

    console.log('Users created...');

    // Create food places around Loyola College
    const places = await Place.create([
      {
        name: 'Murugan Idli Shop',
        description: 'Famous for soft idlis and crispy dosas. A favorite among students for quick, affordable South Indian meals.',
        vegFlag: true,
        priceRange: '₹₹',
        cuisine: 'South Indian',
        latitude: 13.0660,
        longitude: 80.2540,
        address: '25, Sterling Road, Nungambakkam',
        landmark: 'Opposite Loyola College Main Gate',
        googleMapsUrl: 'https://maps.google.com/?q=13.0660,80.2540',
        openingHours: { open: '07:00', close: '22:00' },
        contact: { phone: '+91-44-28291234' },
        images: ['murugan-idli.jpg'],
        menu: [
          {
            category: 'Breakfast',
            items: [
              { name: 'Plain Dosa', price: 45, description: 'Crispy fermented crepe', veg: true },
              { name: 'Masala Dosa', price: 65, description: 'Dosa with potato filling', veg: true },
              { name: 'Idli (2 pcs)', price: 30, description: 'Steamed rice cakes', veg: true },
              { name: 'Pongal', price: 50, description: 'Rice and lentil dish', veg: true }
            ]
          },
          {
            category: 'Lunch',
            items: [
              { name: 'Meals', price: 120, description: 'Unlimited South Indian meal', veg: true },
              { name: 'Curd Rice', price: 60, description: 'Yogurt rice with tempering', veg: true }
            ]
          }
        ],
        averageRating: 4.5,
        reviewCount: 125,
        likeCount: 89,
        featured: true
      },
      {
        name: 'Annalakshmi Restaurant',
        description: 'Vegetarian restaurant serving authentic Chettinad and North Indian cuisine in a comfortable setting.',
        vegFlag: true,
        priceRange: '₹₹₹',
        cuisine: 'North Indian',
        latitude: 13.0645,
        longitude: 80.2528,
        address: '12, College Road, Nungambakkam',
        landmark: 'Near Loyola College Hostel',
        googleMapsUrl: 'https://maps.google.com/?q=13.0645,80.2528',
        openingHours: { open: '11:00', close: '23:00' },
        contact: { phone: '+91-44-28294567' },
        images: ['annalakshmi.jpg'],
        menu: [
          {
            category: 'Main Course',
            items: [
              { name: 'Paneer Butter Masala', price: 220, description: 'Cottage cheese in rich tomato gravy', veg: true },
              { name: 'Dal Makhani', price: 180, description: 'Creamy black lentils', veg: true },
              { name: 'Veg Biryani', price: 190, description: 'Fragrant rice with vegetables', veg: true }
            ]
          },
          {
            category: 'Breads',
            items: [
              { name: 'Butter Naan', price: 60, description: 'Leavened white flour bread', veg: true },
              { name: 'Roti', price: 25, description: 'Whole wheat bread', veg: true }
            ]
          }
        ],
        averageRating: 4.2,
        reviewCount: 89,
        likeCount: 67,
        featured: true
      },
      {
        name: 'Zaitoon',
        description: 'Popular spot for Arabic and Chinese cuisine. Known for their shawarma and noodles.',
        vegFlag: false,
        priceRange: '₹₹',
        cuisine: 'Arabic',
        latitude: 13.0672,
        longitude: 80.2551,
        address: '8, Sterling Road, Nungambakkam',
        landmark: 'Next to ICICI Bank',
        googleMapsUrl: 'https://maps.google.com/?q=13.0672,80.2551',
        openingHours: { open: '11:00', close: '23:30' },
        contact: { phone: '+91-44-28297890' },
        images: ['zaitoon.jpg'],
        menu: [
          {
            category: 'Arabic',
            items: [
              { name: 'Chicken Shawarma', price: 120, description: 'Grilled chicken wrap', veg: false },
              { name: 'Beef Shawarma', price: 140, description: 'Grilled beef wrap', veg: false },
              { name: 'Hummus with Pita', price: 90, description: 'Chickpea dip with bread', veg: true }
            ]
          },
          {
            category: 'Chinese',
            items: [
              { name: 'Chicken Noodles', price: 130, description: 'Stir-fried noodles with chicken', veg: false },
              { name: 'Veg Manchurian', price: 150, description: 'Vegetable balls in sauce', veg: true }
            ]
          }
        ],
        averageRating: 4.3,
        reviewCount: 156,
        likeCount: 112
      },
      {
        name: 'Sangeetha Vegetarian',
        description: 'Classic vegetarian restaurant chain serving diverse South Indian dishes and North Indian favorites.',
        vegFlag: true,
        priceRange: '₹₹',
        cuisine: 'South Indian',
        latitude: 13.0638,
        longitude: 80.2515,
        address: '45, Commander-in-Chief Road, Egmore',
        landmark: 'Near Ethiraj College',
        googleMapsUrl: 'https://maps.google.com/?q=13.0638,80.2515',
        openingHours: { open: '06:00', close: '23:00' },
        contact: { phone: '+91-44-28291234' },
        images: ['sangeetha.jpg'],
        menu: [
          {
            category: 'Breakfast',
            items: [
              { name: 'Rava Dosa', price: 75, description: 'Crispy semolina crepe', veg: true },
              { name: 'Uttapam', price: 70, description: 'Savory rice pancake', veg: true },
              { name: 'Vada (2 pcs)', price: 40, description: 'Savory fried donut', veg: true }
            ]
          },
          {
            category: 'Juices',
            items: [
              { name: 'Fresh Lime', price: 35, description: 'Fresh lime juice', veg: true },
              { name: 'Watermelon Juice', price: 50, description: 'Fresh watermelon juice', veg: true }
            ]
          }
        ],
        averageRating: 4.0,
        reviewCount: 203,
        likeCount: 145
      },
      {
        name: 'BBQ Nation',
        description: 'Lively restaurant offering unlimited barbecue and buffet with live grills at tables.',
        vegFlag: false,
        priceRange: '₹₹₹₹',
        cuisine: 'Barbecue',
        latitude: 13.0681,
        longitude: 80.2567,
        address: '3rd Floor, Express Avenue Mall, White\'s Road',
        landmark: 'Express Avenue Mall',
        googleMapsUrl: 'https://maps.google.com/?q=13.0681,80.2567',
        openingHours: { open: '12:00', close: '23:30' },
        contact: { phone: '+91-44-28294567' },
        images: ['bbq-nation.jpg'],
        menu: [
          {
            category: 'Buffet',
            items: [
              { name: 'Lunch Buffet', price: 699, description: 'Unlimited barbecue and main course', veg: false },
              { name: 'Dinner Buffet', price: 799, description: 'Unlimited barbecue and main course', veg: false }
            ]
          }
        ],
        averageRating: 4.4,
        reviewCount: 178,
        likeCount: 134
      },
      {
        name: 'A2B - Adyar Ananda Bhavan',
        description: 'Pure vegetarian restaurant famous for traditional South Indian food and sweets.',
        vegFlag: true,
        priceRange: '₹₹',
        cuisine: 'South Indian',
        latitude: 13.0623,
        longitude: 80.2501,
        address: '78, Commander-in-Chief Road, Egmore',
        landmark: 'Near Egmore Station',
        googleMapsUrl: 'https://maps.google.com/?q=13.0623,80.2501',
        openingHours: { open: '06:00', close: '22:30' },
        contact: { phone: '+91-44-28297890' },
        images: ['a2b.jpg'],
        menu: [
          {
            category: 'Sweets',
            items: [
              { name: 'Mysore Pak', price: 45, description: 'Chickpea flour sweet', veg: true },
              { name: 'Badusha', price: 35, description: 'Flour and sugar sweet', veg: true }
            ]
          },
          {
            category: 'Snacks',
            items: [
              { name: 'Bonda', price: 30, description: 'Potato fritters', veg: true },
              { name: 'Samosa', price: 25, description: 'Fried pastry with filling', veg: true }
            ]
          }
        ],
        averageRating: 4.1,
        reviewCount: 267,
        likeCount: 189
      },
      {
        name: 'Chinese Wok',
        description: 'Small eatery specializing in authentic Chinese street food and quick meals.',
        vegFlag: false,
        priceRange: '₹',
        cuisine: 'Chinese',
        latitude: 13.0658,
        longitude: 80.2549,
        address: '15, Sterling Road, Nungambakkam',
        landmark: 'Opposite Coffee Day',
        googleMapsUrl: 'https://maps.google.com/?q=13.0658,80.2549',
        openingHours: { open: '10:00', close: '22:00' },
        contact: { phone: '+91-44-28291234' },
        images: ['chinese-wok.jpg'],
        menu: [
          {
            category: 'Noodles',
            items: [
              { name: 'Veg Hakka Noodles', price: 80, description: 'Stir-fried noodles', veg: true },
              { name: 'Chicken Noodles', price: 100, description: 'Stir-fried noodles with chicken', veg: false },
              { name: 'Egg Noodles', price: 90, description: 'Stir-fried noodles with egg', veg: false }
            ]
          },
          {
            category: 'Rice',
            items: [
              { name: 'Veg Fried Rice', price: 85, description: 'Stir-fried rice with vegetables', veg: true },
              { name: 'Chicken Fried Rice', price: 110, description: 'Stir-fried rice with chicken', veg: false }
            ]
          }
        ],
        averageRating: 3.9,
        reviewCount: 89,
        likeCount: 56
      },
      {
        name: 'Saravana Bhavan',
        description: 'World-renowned chain for authentic South Indian vegetarian cuisine.',
        vegFlag: true,
        priceRange: '₹₹',
        cuisine: 'South Indian',
        latitude: 13.0640,
        longitude: 80.2530,
        address: '124, Nungambakkam High Road',
        landmark: 'Near SIET College',
        googleMapsUrl: 'https://maps.google.com/?q=13.0640,80.2530',
        openingHours: { open: '06:00', close: '23:00' },
        contact: { phone: '+91-44-28291111' },
        images: ['saravana.jpg'],
        menu: [
          {
            category: 'Specialties',
            items: [
              { name: 'Ghee Roast Dosa', price: 95, description: 'Dosa cooked in pure ghee', veg: true },
              { name: 'Filter Coffee', price: 25, description: 'Traditional South Indian coffee', veg: true },
              { name: 'Mini Meals', price: 110, description: 'Quick South Indian lunch', veg: true }
            ]
          }
        ],
        averageRating: 4.3,
        reviewCount: 312,
        likeCount: 245
      },
      {
        name: 'Noodle Bar',
        description: 'Contemporary Asian eatery with build-your-own noodle bowls and stir-fries.',
        vegFlag: false,
        priceRange: '₹₹',
        cuisine: 'Asian Fusion',
        latitude: 13.0665,
        longitude: 80.2555,
        address: '32, Sterling Road, Nungambakkam',
        landmark: 'Above Cafe Coffee Day',
        googleMapsUrl: 'https://maps.google.com/?q=13.0665,80.2555',
        openingHours: { open: '11:00', close: '23:00' },
        contact: { phone: '+91-44-28293333' },
        images: ['noodle-bar.jpg'],
        menu: [
          {
            category: 'Noodle Bowls',
            items: [
              { name: 'Build Your Own Bowl', price: 180, description: 'Choose your noodles, protein, and sauce', veg: false },
              { name: 'Thai Green Curry Noodles', price: 220, description: 'Spicy Thai curry with noodles', veg: true }
            ]
          }
        ],
        averageRating: 4.1,
        reviewCount: 134,
        likeCount: 98
      },
      {
        name: 'The Burger Junction',
        description: 'Gourmet burger joint with creative burger combinations and loaded fries.',
        vegFlag: false,
        priceRange: '₹₹',
        cuisine: 'American',
        latitude: 13.0670,
        longitude: 80.2560,
        address: '18, College Road, Nungambakkam',
        landmark: 'Near Loyola College Auditorium',
        googleMapsUrl: 'https://maps.google.com/?q=13.0670,80.2560',
        openingHours: { open: '12:00', close: '23:00' },
        contact: { phone: '+91-44-28294444' },
        images: ['burger-junction.jpg'],
        menu: [
          {
            category: 'Burgers',
            items: [
              { name: 'Classic Cheeseburger', price: 150, description: 'Beef patty with cheese and veggies', veg: false },
              { name: 'Veg Supreme Burger', price: 120, description: 'Vegetable patty with special sauce', veg: true },
              { name: 'Loaded Fries', price: 90, description: 'Fries with cheese and toppings', veg: false }
            ]
          }
        ],
        averageRating: 4.0,
        reviewCount: 87,
        likeCount: 65
      }
    ]);

    console.log('Places created...');

    // Create communities
    const communities = await Community.create([
        {
    name: 'Loyola Foodies',
    description: 'For Loyola students who love exploring new food spots together',
    createdBy: users[1]._id,
    isPrivate: false,
    tags: ['Loyola', 'Food Exploration', 'Student']
  },
  {
    name: 'Weekend Food Adventures',
    description: 'Planning weekend food trips and trying different cuisines',
    createdBy: users[2]._id,
    isPrivate: true,
    password: 'foodie123',
    members: [users[1]._id, users[3]._id, users[4]._id],
    tags: ['Weekend', 'Adventure', 'Cuisine']
  },
  {
    name: 'Budget Eaters Club',
    description: 'Finding the best affordable food options around campus',
    createdBy: users[3]._id,
    isPrivate: true,
    password: 'budget456',
    members: [users[1]._id, users[2]._id],
    tags: ['Budget', 'Affordable', 'Student']
  },
  {
    name: 'Vegetarian Food Lovers',
    description: 'For vegetarians to share food spots and recipes',
    createdBy: users[4]._id,
    isPrivate: false,
    tags: ['Vegetarian', 'Healthy', 'Recipes']
  }
    ]);

    console.log('Communities created...');

    // Create community messages
    await CommunityMessage.create([
      {
        communityId: communities[0]._id,
        userId: users[1]._id,
        text: 'Hey everyone! Anyone tried the new Chinese place near college?',
        attachedPlaceId: places[6]._id
      },
      {
        communityId: communities[0]._id,
        userId: users[2]._id,
        text: 'Yes! Their noodles are amazing and really affordable too. The chicken noodles are particularly good!'
      },
      {
        communityId: communities[0]._id,
        userId: users[3]._id,
        text: 'I prefer the veg options there. Their Manchurian is pretty decent for the price.'
      },
      {
        communityId: communities[1]._id,
        userId: users[2]._id,
        text: 'Planning to go to BBQ Nation this weekend. Anyone interested?'
      },
      {
        communityId: communities[1]._id,
        userId: users[3]._id,
        text: 'Count me in! I\'ve been wanting to try their buffet. Heard they have amazing starters.'
      },
      {
        communityId: communities[1]._id,
        userId: users[4]._id,
        text: 'Me too! What time are we planning to go?'
      },
      {
        communityId: communities[2]._id,
        userId: users[3]._id,
        text: 'Found this amazing street food vendor near campus. Chaat for just ₹30!'
      },
      {
        communityId: communities[2]._id,
        userId: users[1]._id,
        text: 'Where exactly? I\'m always looking for good budget options.'
      },
      {
        communityId: communities[3]._id,
        userId: users[4]._id,
        text: 'Has anyone tried the butter naan at Annalakshmi? Is it worth the price?',
        attachedPlaceId: places[1]._id
      },
      {
        communityId: communities[3]._id,
        userId: users[2]._id,
        text: 'Absolutely! Their North Indian food is authentic. The paneer butter masala pairs perfectly with it.'
      }
    ]);

    console.log('Messages created...');

    // Create polls
    const poll1 = await Poll.create({
      question: 'Where should we have lunch tomorrow?',
      communityId: communities[0]._id,
      createdBy: users[1]._id,
      closesAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });

    const poll1Options = await PollOption.create([
      { pollId: poll1._id, text: 'Murugan Idli Shop' },
      { pollId: poll1._id, text: 'Sangeetha Vegetarian' },
      { pollId: poll1._id, text: 'Chinese Wok' },
      { pollId: poll1._id, text: 'Saravana Bhavan' }
    ]);

    const poll2 = await Poll.create({
      question: 'Favorite cuisine for dinner?',
      communityId: communities[1]._id,
      createdBy: users[2]._id,
      closesAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
    });

    const poll2Options = await PollOption.create([
      { pollId: poll2._id, text: 'South Indian' },
      { pollId: poll2._id, text: 'Chinese' },
      { pollId: poll2._id, text: 'North Indian' },
      { pollId: poll2._id, text: 'Arabic' },
      { pollId: poll2._id, text: 'American' }
    ]);

    const poll3 = await Poll.create({
      question: 'Best budget food spot around campus?',
      communityId: communities[2]._id,
      createdBy: users[3]._id
    });

    const poll3Options = await PollOption.create([
      { pollId: poll3._id, text: 'Murugan Idli Shop' },
      { pollId: poll3._id, text: 'Chinese Wok' },
      { pollId: poll3._id, text: 'A2B' },
      { pollId: poll3._id, text: 'Street Food Vendors' }
    ]);

    console.log('Polls created...');

    // Create some sample votes
    await PollVote.create([
      { pollId: poll1._id, optionId: poll1Options[0]._id, userId: users[1]._id },
      { pollId: poll1._id, optionId: poll1Options[0]._id, userId: users[2]._id },
      { pollId: poll1._id, optionId: poll1Options[2]._id, userId: users[3]._id },
      { pollId: poll2._id, optionId: poll2Options[1]._id, userId: users[2]._id },
      { pollId: poll2._id, optionId: poll2Options[3]._id, userId: users[3]._id },
      { pollId: poll2._id, optionId: poll2Options[1]._id, userId: users[4]._id },
      { pollId: poll3._id, optionId: poll3Options[0]._id, userId: users[1]._id },
      { pollId: poll3._id, optionId: poll3Options[0]._id, userId: users[3]._id },
      { pollId: poll3._id, optionId: poll3Options[2]._id, userId: users[4]._id }
    ]);

    console.log('Votes created...');

    // Create some sample reviews
    const Review = require('./models/Review');
    await Review.create([
      {
        placeId: places[0]._id,
        userId: users[1]._id,
        rating: 5,
        text: 'Absolutely love the idlis here! Soft and fluffy, just the way I like them. The sambar is flavorful and the chutneys are fresh. Perfect breakfast spot!'
      },
      {
        placeId: places[0]._id,
        userId: users[2]._id,
        rating: 4,
        text: 'Great place for quick South Indian meals. The masala dosa is crispy and the potato filling is well-spiced. A bit crowded during peak hours though.'
      },
      {
        placeId: places[2]._id,
        userId: users[3]._id,
        rating: 4,
        text: 'The shawarma here is amazing! Perfectly spiced and the garlic sauce is to die for. A bit pricey but worth it for the quality.'
      },
      {
        placeId: places[6]._id,
        userId: users[4]._id,
        rating: 3,
        text: 'Decent Chinese food for the price. The noodles are good but could use more vegetables. Quick service and student-friendly prices.'
      },
      {
        placeId: places[1]._id,
        userId: users[1]._id,
        rating: 5,
        text: 'Excellent North Indian food! The paneer butter masala is creamy and rich. Service is prompt and the ambiance is comfortable.'
      }
    ]);

    console.log('Reviews created...');

    // Create some saved places
    const SavedPlace = require('./models/SavedPlace');
    await SavedPlace.create([
      { userId: users[1]._id, placeId: places[0]._id },
      { userId: users[1]._id, placeId: places[2]._id },
      { userId: users[1]._id, placeId: places[4]._id },
      { userId: users[2]._id, placeId: places[1]._id },
      { userId: users[2]._id, placeId: places[6]._id },
      { userId: users[3]._id, placeId: places[0]._id },
      { userId: users[3]._id, placeId: places[5]._id },
      { userId: users[4]._id, placeId: places[2]._id },
      { userId: users[4]._id, placeId: places[3]._id }
    ]);

    console.log('Saved places created...');

    console.log('Database seeded successfully!');
    console.log(`Created: ${users.length} users, ${places.length} places, ${communities.length} communities`);
    console.log(`Sample admin login: admin@foodconnect.com / admin123`);
    console.log(`Sample user login: john@student.com / student123`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};


// Run seeding
connectDB().then(() => {
  seedData();
});
