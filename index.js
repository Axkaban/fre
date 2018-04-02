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
    // allowNull: false,
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
    // allowNull: false,
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  release_date: {
    type: Sequelize.DATE,
    allowNull: false
  },
  tagline: {
    type: Sequelize.STRING,
    allowNull: false
  },
  revenue: {
    type: Sequelize.BIGINT,
    allowNull: false
  },
  budget: {
    type: Sequelize.BIGINT,
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
    references: {
      model: Genres,
      key: 'id'
    }
  }
}, 
{
  timestamps: false // NEEDED to not get a createdAt and updatedAt fields on the query
});




// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations); //getFilmRecommendations
// if anything else rather than the route above it will handle a 404 response
app.get('*', (req, res) => {
  res.status(404).send({
    message: 'Not found'
  });
});


// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  // res.status(500).send('Not Implemented');
  // variable to have all the matches for genre and date range
  let films_match;
  // object to populate and return
  let recommendations = {
    recommendations: []
  };
   // check if query values for metadata exist, else they're assigned default values. Create the meta object.
   if (req.query.offset) {

     if (req.query.limit) {

       recommendations.meta = { 
         limit: parseInt(req.query.limit),
         offset: parseInt(req.query.offset)
          };

     } else {

       recommendations.meta = { 
         limit: 10,
         offset: parseInt(req.query.offset)
         };
       
     }
  } else if (req.query.limit) {

     recommendations.meta = { 
       limit: parseInt(req.query.limit),
       offset: 0
       };
     
  } else {

     recommendations.meta = { 
       limit: 10,
       offset: 0
       };

  }
// Search for the film with the id parameter
  Films.findById(req.params.id)
  .then(filmData => {
    
    if(!filmData || filmData === null){
      res.status(422).send({
        message: 'Not found'
      });
      throw 'Wrong id';
    }
   
    return filmData.dataValues;
    
  })
  .then(obj => {

    // Need to associate tables
    Films.belongsTo(Genres, {
      foreignKey: 'genre_id'
    });

    // for date range
    let date = new Date(obj.release_date);
    let min_from = `${date.getFullYear() - 15}-${date.getMonth()}-${date.getDate()}`;
    let max_from = `${date.getFullYear() + 15}-${date.getMonth()}-${date.getDate()}`;
    console.log(date, 'this is min: ' + min_from, 'this is max: '+ max_from);

// Getting all the films from db with same genre and within the date range
    return Films.findAll({
      include: [{
        model: Genres,
        where: { id: Sequelize.col('films.genre_id')}
      }],
      attributes: ['id', 'title', ['release_date', 'releaseDate']],
      where: {
        genre_id: obj.genre_id,
        release_date: {
          $between: [min_from, max_from] // sequelize have a between parameter for a range!
        }
      },
      // limit: `${recommendations.meta.limit}`,
      // offset: `${recommendations.meta.offset}`  
    });
  }) //Use the returned films to create an array of ids and get the ratings
  .then(related => {
    
    let ids = [];
    //save array of film objects
    films_match = related.map(singleFilm => singleFilm.dataValues);
    // populate array of ids
    related.forEach(singleFilm => ids.push(singleFilm.id));
    return ids;

  })
  .then(ids =>{
    const url = 'http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=';
    
    request.get(`${url}${ids}`, function (err, res, body) {

      let reviews = JSON.parse(res.body);

      reviews.forEach(rev => {
        
        if(rev.reviews.length >= 5){
          // variable for  sum rating must be declared after checking length of array 
          let avg_rating = 0;

        

          // let add = (increase, current) => increase + current;
          rev.reviews.forEach(rate => avg_rating += rate.rating);
          
          // Thanks to Arne H. Bitubekk on stack overflow for the right kind of average 
          // https://stackoverflow.com/questions/15762768/javascript-math-round-to-two-decimal-places

          let filmAverage = Number(Math.round((avg_rating / rev.reviews.length) + 'e2') + 'e-2').toFixed(2);

          
            // checking if average is greater than 4, if so add average rating to the array and push to the recomendations array
          if(filmAverage >= 4.0){

            films_match.find((film, i)=>{

              if(rev.film_id === film.id){

                films_match[i].genre = films_match[i].genre.name;
                films_match[i].averageRating = filmAverage;
                films_match[i].reviews = rev.reviews.length;
                
                recommendations.recommendations.push(films_match[i]);

                // return true; 
              }
            });
          }
        }
      });
  //offseting and limiting the recomendations object before sending it

  if (recommendations.meta.offset > 0) {

    recommendations.recommendations.splice(0, recommendations.meta.offset);
  }

  if (recommendations.recommendations.length > recommendations.meta.limit) {

    recommendations.recommendations.splice(recommendations.meta.limit, recommendations.recommendations.length - recommendations.meta.limit);

  }

  responseFunction();
    });
  }).catch(err => console.log(err));

  // Needs response to be declared on the function callback of the route to be able to send the recomendations data
let responseFunction = () => { res.status(200).json(recommendations); };

}

module.exports = app;
