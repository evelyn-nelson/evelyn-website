const db = require('../models');
const Article = db.articles
const { Op } = require('sequelize')
const Sequelize = require('../db')
const { restart } = require('nodemon');
const User = require('../models/user.model'); 
const ArticleView = require('../models/articleView.model.js')

// Create and Save a new Article
exports.create = (req, res) => {
    // Validate request
    if (!req.body.title) {
        res.status(400).send({
          message: "Content can not be empty!"
        });
        return;
      }

    // Create a Article
    const article = {
        title: req.body.title,
        body: req.body.body,
        userId: req.body.userId
    };
    // Save Article in the database
    Article.create(article)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the article."
        });
      });
  };

// Retrieve all Articles from the database.
exports.findAll = (req, res) => {  
    Article.findAll({attributes: ['id', 'title','body']})
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving articles."
        });
      });
  };
  

// Find 50 most recent articles
exports.findRecent = (req, res) => {
  const page = parseInt(req.params.page, 10)
  let offset = 0;
  if (page == NaN) {
    offset = 0;
  } else {
    offset = page * 50
  }
  Article.findAll({
    include: [{
      model: User,
      attributes: ['username']
    }],
    order: [['createdAt', 'DESC']],
    limit: 50,
    offset: offset,
    attributes: ['id', 'title','body'] 
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving articles."
    });
  });
}

exports.topAllTime = (req, res) => {
  console.log('beginning')
  const page = parseInt(req.params.page, 10)
  let offset = 0;
  if (page == NaN) {
    offset = 0;
  } else {
    offset = page * 50
  }
  console.log('sequelize', Sequelize)
  console.log(typeof Sequelize)
  // Sequelize.query("SELECT s.*, users.username FROM (SELECT count(\"articleViews\".id) AS \"viewCount\", articles.id, articles.title, articles.body, articles.\"userId\" FROM articles LEFT JOIN \"articleViews\" ON articles.id = \"articleViews\".\"articleId\" GROUP BY articles.id LIMIT 50 OFFSET 0) AS s JOIN users ON users.id = s.\"userId\" ORDER BY \"viewCount\" DESC;")

  Article.findAll({
    attributes: [
      "id",
      "title",
      "body",
      "userId"
      // [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ]
  })

  Article.findAll({
    attributes: [
      [Sequelize.col('articles.id'), 'id'],
      [Sequelize.col('articles.title'), 'title'],
      [Sequelize.col('articles.body'), 'body'],
      [Sequelize.col('articles.userId'), 'userId'],
      [Sequelize.fn('COUNT', Sequelize.col('articleViews.id')), 'viewCount']
    ],
    include: [{
        model: ArticleView,
        required: false,
        duplicating: false,
        attributes: []
      },
      {
        model: User,
        required: false,
        attributes: ['username']
    }],
    group: ['articles.id', 'user.id'],
    order: [['viewCount', 'DESC']],
    limit: 50
  })
  .then(data => {
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving articles."
    });
  });
}



// Find a single Article with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
  
    Article.findByPk(id)
      .then(data => {
        if (data) {
            res.send(data);
        } else {
          res.status(404).send({
            message: `Cannot find Article with id=${id}.`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving Article with id=" + id
        });
      });
  };

// Find Articles by user id
exports.findArticleByUserId = (req, res) => {
    Article.findAll({ where: { userId: req.params.userId } })
    .then(data => {
    res.send(data);
    })
    .catch(err => {
    res.status(500).send({
        message:
        err.message || "Some error occurred while retrieving users."
    });
    });
};

// Find Articles by username
exports.findArticleByUsername = async (req, res) => {
    try {
      const user = await User.findOne({ where: { username: req.params.username } });
      if (!user) {
        res.status(404).send({ message: "User not found" });
        return;
      }
  
      const articles = await Article.findAll({ where: { userId: user.id } });
      res.send(articles);
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: "Some error occurred while retrieving articles."
      });
    }
};
  

// Update a Article by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;
  
    Article.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Article was updated successfully."
          });
        } else {
          res.send({
            message: `Cannot update Article with id=${id}. Maybe Article was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating Article with id=" + id
        });
      });
  };

// Delete a Article with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
  
    Article.destroy({
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Article was deleted successfully!"
          });
        } else {
          res.send({
            message: `Cannot delete Article with id=${id}. Maybe Article was not found!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Could not delete Article with id=" + id
        });
      });
  };

// Delete all Article from the database.
exports.deleteAll = (req, res) => {
    Article.destroy({
      where: {},
      truncate: false
    })
      .then(nums => {
        res.send({ message: `${nums} Articles were deleted successfully!` });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all articles."
        });
      });
  };
  
