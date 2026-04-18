import React from 'react';
import './AboutUsPage.css';

const AboutUsPage = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <h1>About Us</h1>
      </section>

      <section className="about-mission">
        <h2>Our Mission</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
          quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
          fugiat nulla pariatur.
        </p>
        <p>
          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
          deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus
          error sit voluptatem accusantium doloremque laudantium.
        </p>
      </section>

      <section className="about-team">
        <h2>Our Team</h2>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-avatar">E</div>
            <h3>Employee Employeeoğlu</h3>
            <p className="team-role">Founder & CEO</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum.</p>
          </div>
          <div className="team-card">
            <div className="team-avatar">E</div>
            <h3>Employee Employeeoğlu</h3>
            <p className="team-role">Head of Curation</p>
            <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
          </div>
          <div className="team-card">
            <div className="team-avatar">E</div>
            <h3>Employee Employeeoğlu</h3>
            <p className="team-role">Lead Developer</p>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.</p>
          </div>
        </div>
      </section>

      <section className="about-values">
        <h2>What We Stand For</h2>
        <div className="values-grid">
          <div className="value-item">
            <h3>Authenticity</h3>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi morbi tempus.</p>
          </div>
          <div className="value-item">
            <h3>Quality</h3>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.</p>
          </div>
          <div className="value-item">
            <h3>Trust</h3>
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
