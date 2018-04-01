const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// CREATE DB
var sequelize = new Sequelize('database', null, null, {
      host: 'localhost',
      dialect: 'sqlite',

      storage: DB_PATH
    });

// DB TABLES

const Genres = sequelize.define('genres', {
  id: {
    type: sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: sequelize.STRING,
    allowNull: false
  }
})


const Films = sequelize.define('films', {
  id: {
    type: sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  title: {
    type: sequelize.STRING,
    allowNull: false
  },
  release_date: {
    type: sequelize.STRING,
    allowNull: false
  },
  tagline: {
    type: sequelize.STRING,
    allowNull: false
  },
  revenue: {
    type: sequelize.INTEGER,
    allowNull: false
  },
  budget: {
    type: sequelize.INTEGER,
    allowNull: false
  },
  runtime: {
    type: sequelize.INTEGER,
    allowNull: false
  },
  original_language: {
    type: sequelize.STRING,
    allowNull: false
  },
  status: {
    type: sequelize.STRING,
    allowNull: false
  },
  genre_id: {
    type: sequelize.INTEGER,
    allowNull: false,
    // sequelize alows to connect to other models
    references:{
      model: Genres,
      key: 'id'
    }
  }
});



// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  res.status(500).send('Not Implemented');
}

module.exports = app;
