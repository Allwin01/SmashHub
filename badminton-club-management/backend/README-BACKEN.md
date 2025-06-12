// Connect to MongoDB
mongo

// Switch to your database
use your_database_name

// Find all users
db.users.find()

// Find a specific user
db.users.findOne({firstname: "John"})

// Find with conditions
db.users.find({age: {$gt: 18}})

// Projection (select specific fields)
db.users.find({}, {username: 1, email: 1})

//Find user on Specific Sring

db.users.find({ firstName: { $regex: /test/i } });
db.users.deleteMany({ firstName: { $regex: /test/i } });




Equality Match: db.users.find({status: "active"})
Comparison Operators: db.users.find({age: {$gt: 21}})
Logical Operators: db.users.find({$or: [{status: "active"}, {age: {$lt: 18}}]})
Regular Expressions: db.users.find({username: /John/})



Array Queries: db.users.find({hobbies: "reading"})

Pagination: db.users.find().skip(10).limit(5)

Sorting: db.users.find().sort({createdAt: -1})

// Update a single document
db.users.updateOne(
  { _id: ObjectId("12345") }, // Filter
  { $set: { name: "New Name", status: "active" } } // Update
);

// Update multiple documents
db.users.updateMany(
  { status: "inactive" },
  { $set: { status: "archived" } }
);


// Remove a single document
db.users.deleteOne({ _id: ObjectId("12345") });
db.users.deleteOne({ _id: ObjectId("12345") });

// Remove multiple documents
db.users.deleteMany({ firstName: 'Test*' });
db.users.deleteMany({ email: "test@example.com" });

// Remove documents with case-insensitive match
db.users.deleteMany({ 
  username: { $regex: /^john_doe$/i } 
});


// Remove users whose usernames start with 'admin'
db.users.deleteMany({
  username: { $regex: /^admin/ }
});

// Remove users whose emails end with '.test'
db.users.deleteMany({
  email: { $regex: /\test$/i }
});

// Remove users with usernames containing 'bot'
db.users.deleteMany({
  username: { $regex: /bot/i }
});

// Remove with case-insensitive and multiline options
db.users.deleteMany({
  username: { 
    $regex: "john.*doe",
    $options: "i"  // i = case insensitive
  }
});


// Remove inactive users with gmail addresses
db.users.deleteMany({
  status: "inactive",
  email: { $regex: /@gmail\.com$/i }
});

// Remove users with either 'test' in username or 'temp' in email
db.users.deleteMany({
  $or: [
    { username: { $regex: /test/i } },
    { email: { $regex: /temp/i } }
  ]
});


// Remove all documents (be careful!)
db.users.deleteMany({});

