import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from 'mongodb'
import path from 'path';

/* const articlesInfo = {
  "learn-react": {
    upvotes: 0,
    comments: [],
  },
  "learn-node": {
    upvotes: 0,
    comments: [],
  },
  "my-thoughts-on-resumes": {
    upvotes: 0,
    comments: [],
  },
}; */

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

// this function to destructure the code and make it more clean

const withDB = async (operations, res) => {
  try {
  const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true })
    const db = client.db('my-blog')
    
     await operations(db);

  client.close();
  } catch (error) {
    res.status(500).json({ message: 'Error connecting to db', error})
  }
}

app.get('/api/articles/:name', async (req, res) => {
  withDB(async(db) => {
    const articleName = req.params.name;

  const articleInfo = await db.collection('articles').findOne({ name: articleName })
  res.status(200).json(articleInfo) 
  }, res)
})

app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

  const articleInfo = await db.collection('articles').findOne({ name: articleName })
  await db.collection('articles').updateOne({ name: articleName }, {
    '$set': {
      upvotes: articleInfo.upvotes + 1
    }
  })
  const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })
    res.status(200).json(updatedArticleInfo)
  }, res)  
});

  app.post("/api/articles/:name/add-comment", (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
      const articleInfo = await db.collection('articles').findOne({ name: articleName })
      await db.collection('articles').updateOne({ name: articleName }, {
        '$set': {
          comments: articleInfo.comments.concat({ username, text })
        }
      });

      const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })

      res.status(200).json(updatedArticleInfo);
    }, res)
  });

/* app.get("/hello", (req, res) => res.send("Hello!"));
app.get("/hello/:name", (req, res) => res.send(`Hello ${req.params.name}`));
app.post("/hello", (req, res) => res.send(`Hello ${req.body.name}`)); */


/* build */

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'))
})

app.listen(7000, () => console.log("Listening on port 7000...."));
