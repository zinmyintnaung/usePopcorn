import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useMovies } from "./useMovies";
import { useLocalStorageState } from "./useLocalStorageState";
import { useKey } from "./useKey";

const average = (arr) =>
    arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const KEY = ""; //Use the key here, visit https://www.omdbapi.com/ to get the key

export default function App() {
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState(null);

    const { movies, isLoading, error } = useMovies(query);

    const [watched, setWatched] = useLocalStorageState([], "watched");

    function handleMovieSelect(id) {
        //id === selectedId ? setSelectedId(null) : setSelectedId(id);
        setSelectedId((selectedId) => (id === selectedId ? null : id));
    }
    function handleMovieClose() {
        setSelectedId(null);
    }
    function handleAddWatched(movie) {
        setWatched((watched) => [...watched, movie]);
    }
    function handleRemoveWatched(id) {
        setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
    }

    return (
        <>
            <NavBar>
                <Search query={query} setQuery={setQuery} />
                <Numresult movies={movies} />
            </NavBar>
            <Main>
                <Box>
                    {/* {isLoading ? <Loader /> : <MovieList movies={movies} />} */}
                    {isLoading && <Loader />}
                    {error && <ErrorMessage message={error} />}
                    {!isLoading && !error && (
                        <MovieList
                            movies={movies}
                            onMovieSelect={handleMovieSelect}
                        />
                    )}
                </Box>
                <Box>
                    {selectedId ? (
                        <MovieDetails
                            selectedId={selectedId}
                            onMovieClose={handleMovieClose}
                            onAddWatched={handleAddWatched}
                            watched={watched}
                        />
                    ) : (
                        <>
                            <WatchedSummary watched={watched} />
                            <WatchMovieList
                                watched={watched}
                                onRemoveWatched={handleRemoveWatched}
                            />
                        </>
                    )}
                </Box>
            </Main>
        </>
    );
}
function Loader() {
    return <p className="loader">Fetching data..</p>;
}
function ErrorMessage({ message }) {
    return <p className="error">{message}</p>;
}
function NavBar({ children }) {
    return (
        <nav className="nav-bar">
            <Logo />
            {children}
        </nav>
    );
}
function Logo() {
    return (
        <div className="logo">
            <span role="img">🍿</span>
            <h1>usePopcorn</h1>
        </div>
    );
}
function Search({ query, setQuery }) {
    const inputEl = useRef(null);

    useKey("Enter", function () {
        if (document.activeElement === inputEl.current) return;
        inputEl.current.focus();
        setQuery("");
    });
    useEffect(
        function () {
            function callback(e) {
                if (document.activeElement === inputEl.current) return;
                if (e.code === "Enter") {
                    inputEl.current.focus();
                    setQuery("");
                }
            }

            document.addEventListener("keydown", callback);
            return function () {
                document.removeEventListener("keydown", callback);
            };
        },
        [setQuery]
    );

    return (
        <input
            className="search"
            type="text"
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={inputEl}
        />
    );
}
function Numresult({ movies }) {
    return (
        <p className="num-results">
            Found <strong>{movies.length}</strong> results
        </p>
    );
}

function Main({ children }) {
    return <main className="main">{children}</main>;
}

function Box({ children }) {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="box">
            <button
                className="btn-toggle"
                onClick={() => setIsOpen((open) => !open)}
            >
                {isOpen ? "–" : "+"}
            </button>
            {isOpen && children}
        </div>
    );
}
/*
function WatchedBox() {
    const [watched, setWatched] = useState(tempWatchedData);
    const [isOpen2, setIsOpen2] = useState(true);

    return (
        <div className="box">
            <button
                className="btn-toggle"
                onClick={() => setIsOpen2((open) => !open)}
            >
                {isOpen2 ? "–" : "+"}
            </button>
            {isOpen2 && (
                <>
                    <WatchedSummary watched={watched} />
                    <WatchMovieList watched={watched} />
                </>
            )}
        </div>
    );
}*/
function MovieList({ movies, onMovieSelect }) {
    return (
        <ul className="list list-movies">
            {movies?.map((movie) => (
                <Movie
                    movie={movie}
                    key={movie.imdbID}
                    onMovieSelect={onMovieSelect}
                />
            ))}
        </ul>
    );
}

function Movie({ movie, onMovieSelect }) {
    return (
        <li key={movie.imdbID} onClick={() => onMovieSelect(movie.imdbID)}>
            <img src={movie.Poster} alt={`${movie.Title} poster`} />
            <h3>{movie.Title}</h3>
            <div>
                <p>
                    <span>🗓</span>
                    <span>{movie.Year}</span>
                </p>
            </div>
        </li>
    );
}

function MovieDetails({ selectedId, onMovieClose, onAddWatched, watched }) {
    const [movie, setMovie] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
    const watchedUserRating = watched.find(
        (movie) => movie.imdbID === selectedId
    )?.userRating;

    const countRef = useRef(0);
    useEffect(
        function () {
            if (userRating) {
                countRef.current = countRef.current + 1;
            }
        },
        [userRating]
    );

    const {
        Title: title,
        Year: year,
        Poster: poster,
        Runtime: runtime,
        imdbRating,
        Plot: plot,
        Released: released,
        Actors: actors,
        Director: director,
        Genre: genre,
    } = movie;

    function handleAdd() {
        const newWatchedMovie = {
            imdbID: selectedId,
            title,
            year,
            poster,
            imdbRating: Number(imdbRating),
            runtime: Number(runtime.split(" ").at(0)),
            userRating,
            countRatingDecisions: countRef.current,
        };

        onAddWatched(newWatchedMovie);
        onMovieClose();
    }

    useKey("Escape", onMovieClose);
    useEffect(
        function () {
            const controller = new AbortController();

            async function fetchMovieDetail() {
                try {
                    setIsLoading(true);
                    const res = await fetch(
                        `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`,
                        { signal: controller.signal }
                    );
                    if (!res.ok) {
                        throw new Error(
                            "Something went wrong, try again later!"
                        );
                    }
                    const data = await res.json();

                    if (data.Response === "False") {
                        throw new Error("Movie not found");
                    }
                    setMovie(data);
                } catch (err) {
                    console.log(err);
                } finally {
                    setIsLoading(false);
                }
            }

            fetchMovieDetail();
            return function () {
                controller.abort();
            };
        },
        [selectedId]
    );

    useEffect(
        function () {
            if (!title) return;
            document.title = `Movie | ${title}`;
            return function () {
                document.title = "usePopcorn";
            };
        },
        [title]
    );

    return (
        <div className="details">
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <header>
                        <button className="btn-back" onClick={onMovieClose}>
                            &larr;
                        </button>
                        <img src={poster} alt={`Poster of ${movie} movie`} />
                        <div className="details-overview">
                            <h2>
                                {title} ({year})
                            </h2>
                            <p>
                                {released} &bull; {runtime}
                            </p>
                            <p>{genre}</p>
                            <p>
                                <span>*</span>
                                {imdbRating} IMDB Rating
                            </p>
                        </div>
                    </header>
                    <section>
                        <div className="rating">
                            {!isWatched ? (
                                <>
                                    <StarRating
                                        maxRating={10}
                                        size={24}
                                        onSetRating={setUserRating}
                                    />
                                    {userRating > 0 && (
                                        <button
                                            className="btn-add"
                                            onClick={handleAdd}
                                        >
                                            + Add to Watched
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p>
                                    You rated this movie. Rating:{" "}
                                    {watchedUserRating}
                                </p>
                            )}
                        </div>

                        <p>
                            <em>{plot}</em>
                        </p>
                        <p>Starring {actors}</p>
                        <p>Directed By {director}</p>
                    </section>
                </>
            )}
        </div>
    );
}

function WatchedSummary({ watched }) {
    const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
    const avgUserRating = average(watched.map((movie) => movie.userRating));
    const avgRuntime = average(watched.map((movie) => movie.runtime));
    return (
        <div className="summary">
            <h2>Movies you watched</h2>
            <div>
                <p>
                    <span>#️⃣</span>
                    <span>{watched.length} movies</span>
                </p>
                <p>
                    <span>⭐️</span>
                    <span>{avgImdbRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{avgUserRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{avgRuntime.toFixed(2)} min</span>
                </p>
            </div>
        </div>
    );
}
function WatchMovieList({ watched, onRemoveWatched }) {
    return (
        <ul className="list">
            {watched.map((movie) => (
                <WatchMovie
                    movie={movie}
                    key={movie.imdbID}
                    onRemoveWatched={onRemoveWatched}
                />
            ))}
        </ul>
    );
}
function WatchMovie({ movie, onRemoveWatched }) {
    return (
        <li key={movie.imdbID}>
            <img src={movie.poster} alt={`${movie.title} poster`} />
            <h3>{movie.title}</h3>
            <div>
                <p>
                    <span>⭐️</span>
                    <span>{movie.imdbRating}</span>
                </p>
                <p>
                    <span>🌟</span>
                    <span>{movie.userRating.toFixed(2)}</span>
                </p>
                <p>
                    <span>⏳</span>
                    <span>{movie.runtime} min</span>
                </p>
                <button
                    className="btn-delete"
                    onClick={() => onRemoveWatched(movie.imdbID)}
                >
                    X
                </button>
            </div>
        </li>
    );
}
