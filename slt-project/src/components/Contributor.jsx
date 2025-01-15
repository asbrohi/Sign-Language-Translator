import React from "react";
import "./contributor.css";

const contributors = [
  {
    name: "Amjad Ali",
    field: "Machine Learning Expert",
    imgSrc: "/Amjad-Ali.jpg", // Add the correct path to the image
  },
  {
    name: "Muhammad Ahsan",
    field: "Web Developer",
    imgSrc: "/Muhammad-Ahsan.jpg",
  },
  {
    name: "Abdul Sattar Brohi",
    field: "Data Engineer",
    imgSrc: "/Brohi.jpg",
  },
];

const Contributor = () => {
  return (
    <div>
      <div className="contributors-section">
        <h3 className="contributors-title">CONTRIBUTORS</h3>
        <div className="contributors-grid">
          {contributors.map((contributor, index) => (
            <div key={index} className="contributor-card">
              <img
                src={contributor.imgSrc}
                alt={contributor.name}
                className="contributor-image"
              />
              <p className="contributor-name">{contributor.name}</p>
              <p className="contributor-field">{contributor.field}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contributor;
