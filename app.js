const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "moviesData.db");

app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBMovieObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDBDirectorObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//Returns a list of all movie names in the movie table
//GET API 1
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT
      movie_name 
    FROM 
      movie;`;
  const movieResponse = await db.all(getMoviesQuery);
  response.send(
    movieResponse.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//Creates a new movie in the movie table.
// POST API 2
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const createMovieQuery = ` 
    INSERT INTO 
      movie (director_id, movie_name, lead_actor) 
    VALUES
    (${directorId}, '${movieName}', '${leadActor}');`;
  await db.run(createMovieQuery);
  response.send(`Movie Successfully Added`);
});

//Returns a movie based on the movie ID
//GET API 3
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT 
      * 
    FROM 
      movie
    WHERE 
      movie_id = ${movieId};`;
  const getMovieResponse = await db.get(getMovieQuery);
  response.send(convertDBMovieObject(getMovieResponse));
});

//Updates the details of a movie in the movie table based on the movie ID
// PUT API 4
app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieDetailsQuery = `
    UPDATE 
      movie 
    SET 
      director_id = ${directorId},
      movie_name = '${movieName}',
      lead_actor = '${leadActor}'
    WHERE 
      movie_id = ${movieId};`;
  await db.run(updateMovieDetailsQuery);
  response.send("Movie Details Updated");
});

//Deletes a movie from the movie table based on the movie ID
// DELETE API 5
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM 
      movie
    WHERE 
      movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//Returns a list of all directors in the director table
// GET API 6
app.get("/directors/", async (request, response) => {
  const directorListQuery = `
    SELECT 
      * 
    FROM 
      director;`;
  const directorResponse = await db.all(directorListQuery);
  response.send(
    directorResponse.map((eachDirector) =>
      convertDBDirectorObject(eachDirector)
    )
  );
});

//Returns a list of all movie names directed by a specific director
//GET API 7
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorsQuery = `
    SELECT
      movie_name 
    FROM 
      movie 
    WHERE 
    director_id = '${directorId}';`;
  const getDirectorResponse = await db.all(getDirectorsQuery);
  response.send(
    getDirectorResponse.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});

module.exports = app;
