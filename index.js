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
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  }
},
{
  timestamps: false // NEEDED to not get a createdAt and updatedAt fields on the query
})



const Films = sequelize.define('films', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  release_date: {
    type: Sequelize.STRING,
    allowNull: false
  },
  tagline: {
    type: Sequelize.STRING,
    allowNull: false
  },
  revenue: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  budget: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  runtime: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  original_language: {
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false
  },
  genre_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    // sequelize alows to connect to other models
    references:{
      model: Genres,
      key: 'id'
    }
  }
}, 
{
  timestamps: false // NEEDED to not get a createdAt and updatedAt fields on the query
});




// ROUTES
app.get('/films/:id([0-9]+)/recommendations', getFilmRecommendations); //getFilmRecommendations
// if anything else rather than the route above it will handle a 404 response
app.use('*', (req, res) => {
  res.status(404).send({
    Message: '404 This is not a valid route'
  });
});


// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  // res.status(500).send('Not Implemented');
  let recommendations = {
    recommendations: []
  };
   // check if query values for metadata exist, else they're assigned default values
   if (req.query.offset) {

     if (req.query.limit) {

       recommendations.meta = { 'limit': parseInt(req.query.limit) };
       recommendations.meta = { 'offset': parseInt(req.query.offset) };

     } else {

       recommendations.meta = { 'limit': 10 };
       recommendations.meta = { 'offset': parseInt(req.query.offset) };

       
     }
  } else if (req.query.limit) {

     recommendations.meta.limit = { 'limit': parseInt(req.query.limit) };
     recommendations.meta.offset = { 'offset':1 };
     
  } else {

     recommendations.meta.limit = { 'limit': 10 };
     recommendations.meta.offset = { 'offset':1 };

  }
// 
  Films.findById(req.params.id)
  .then((filmData)=>{
    if(!filmData){
      res.status(404).send({
        Message: 'There is no film with that id'
      });
    }
    console.log(filmData.dataValues);
    return filmData.dataValues;
    
  });
}

module.exports = app;
