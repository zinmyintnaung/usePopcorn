import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
//import StarRating from "./StarRating";
//import { useState } from "react";

/* function Test() {
    const [movieRating, setMovieRating] = useState(0);
    return (
        <>
            <StarRating maxRating={10} onSetRating={setMovieRating} />
            <p>This movie was rated {movieRating} stars</p>
        </>
    );
} */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        {
            <>
                <App />
            </>
        }
    </React.StrictMode>
);
