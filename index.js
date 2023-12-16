
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// Connect to MongoDB
// Connect to MongoDB
// const atlasConnectionString = 'mongodb://127.0.0.1:27017/virtualbookstoredb'
const atlasConnectionString = 'mongodb+srv://dulanga:Y8MU1GSO0INUbXDB@cluster0.7bwj7mi.mongodb.net/virtualbookstoredb?retryWrites=true&w=majority';

mongoose.connect(atlasConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB Atlas!');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB Atlas', err.reason);
  });

const app = express();
app.use(bodyParser.json());
app.use(cors());


const allowedOrigins = ['http://localhost:4200','https://virtualbookstore.azurewebsites.net/']; // Add your frontend URL
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

const bookSchema = new mongoose.Schema({
  bookid: { type: String, required: true },
  title: { type: String, required: true },
  author: [{ type: String, required: true }], 
  description: { type: String, required: true },
  rating: { type: Number },
  category: { type: String },
  reviews: [
    {
      reviewerName: { type: String, required: true },
      reviewText: { type: String, required: true },
    },
  ],
  noOfBooksInStore: { type: Number, required: true },
  noOfBooksSold: { type: Number },
  price: { type: Number, required: true },
  imageUrl: { type: String }, // New field for storing image path
});

const Book = mongoose.model('Book', bookSchema);

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'D:/DulangaRajapaksha/MSc/webDev/project/New folder/front/src/assets/images/'); // Set the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension); // Set the file name
  },
});

const upload = multer({ storage: storage });

// Create a new book with image upload
app.post('/api/addbooks', upload.single('bookImage'), (req, res) => {
  const {
    bookid,
    title,
    author,
    description,
    rating,
    reviews,
    category,
    noOfBooksInStore,
    noOfBooksSold,
    price,
  } = req.body;

  if (!bookid || !title || !author || !description || !noOfBooksInStore || !category || !price) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  const formattedReviews = reviews.map((review) => ({
    reviewerName: review.reviewerName,
    reviewText: review.reviewText,
  }));

  const newBook = new Book({
    bookid,
    title,
    author: Array.isArray(author) ? author : [author],
    description,
    rating,
    category,
    reviews: Array.isArray(reviews) ? reviews : [reviews],
    noOfBooksInStore,
    noOfBooksSold,
    price,
    imageUrl: req.file ? req.file.path.replace(/[\\/]/g, '/').replace('D:/DulangaRajapaksha/MSc/webDev/project/New folder/front/src', '') : null,
  });

  newBook.save()
    .then(() => {
      res.status(201).json({ message: 'Book added successfully' });
    })
    .catch((err) => {
      res.status(500).json({ error: 'Error adding the book', details: err });
    });
});

app.get('/api/getbooks', (req, res) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Error getting books', details: err });
    });
});

// Get a single book by bookid (GET)
app.get('/api/books/:bookid', (req, res) => {
  let bookid = req.params.bookid;
  Book.findOne({ bookid })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      res.status(200).json(book);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Error getting the book', details: err });
    });
});

// Update a book by bookid (PUT)
app.put('/api/books/:bookid', (req, res) => {
  let bookid = req.params.bookid;
  let updateData = req.body;
  Book.findOneAndUpdate({ bookid }, updateData, { new: true })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      res.status(200).json({ message: 'Book updated successfully' });
    })
    .catch((err) => {
      res.status(500).json({ error: 'Error updating the book', details: err });
    });
});

// Delete a book by bookid (DELETE)
app.delete('/api/books/:bookid', (req, res) => {
  const bookid = req.params.bookid;
  Book.findOneAndDelete({ bookid })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      res.status(200).json({ message: 'Book deleted successfully' });
    })
    .catch((err) => {
      res.status(500).json({ error: 'Error deleting the book', details: err });
    });
});

//--------------------------users-----------------------------------------------------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: false },
  name: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

app.post('/api/users', async (req, res) => {
  const { username, email, password, role,name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }


  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: "user",
      name
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error creating the user', details: err });
  }
});

// Get all users
app.get('/api/users', (req, res) => {
  User.find()
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Error getting users', details: err });
    });
});

// Get a single user by username
app.get('/api/users/:username', (req, res) => {
  const username = req.params.username;
  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(user);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Error getting the user', details: err });
    });
});

// Update a user by username
app.put('/api/users/:username', (req, res) => {
  const username = req.params.username;
  const updateData = req.body;
  User.findOneAndUpdate({ username }, updateData, { new: true })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ message: 'User updated successfully' });
    })
    .catch((err) => {
      res.status(500).json({ error: 'Error updating the user', details: err });
    });
});

// Delete a user by username
app.delete('/api/users/:username', (req, res) => {
  const username = req.params.username;
  User.findOneAndDelete({ username })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted successfully' });
    })
    .catch((err) => {
      res.status(500).json({ error: 'Error deleting the user', details: err });
    });


});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    

    if (isPasswordValid) {
      const userResponse = {
        username: user.username,
        useremail: user.email,
        role:user.role,
        userfullname:user.name
      };
      res.status(200).json({ message: 'Login successful',user: userResponse });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error during login', details: err });
  }
});

//--------------------------------------------search

app.get('/api/search', async (req, res) => {
  const { category, searchTerm } = req.query;

  // Implement your search logic here
  // Use 'category' and 'searchTerm' to filter the books

  try {
    const books = await Book.find(/* your search criteria here */);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error searching books', details: error });
  }
});

// Modify your /api/getbooks endpoint to accept a category parameter
app.get('/api/getbooks/:category', (req, res) => {
  const category = req.params.category;

  // If the category is 'All', return all books
  if (category === 'All') {
    Book.find()
      .then((books) => {
        res.status(200).json(books);
      })
      .catch((err) => {
        res.status(500).json({ error: 'Error getting books', details: err });
      });
  } else {
    // If the category is specific, return books in that category
    Book.find({ category })
      .then((books) => {
        res.status(200).json(books);
      })
      .catch((err) => {
        res.status(500).json({ error: 'Error getting books by category', details: err });
      });
  }
});



//---------------------------------------------------------------------------------------------------

// Define a port for the server
const port = process.env.PORT || 4000;

// Start the server
const server = app.listen(port, () => {
  console.log('Connected to port ' + port);
});
