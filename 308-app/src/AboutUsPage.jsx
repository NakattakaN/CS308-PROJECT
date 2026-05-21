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
          At <strong>Saatinden</strong>, our mission is to connect watch enthusiasts with the timepieces of their dreams. We believe that a watch is more than just a tool to tell time; it is a statement of style, a piece of history, and a testament to masterful engineering. We strive to make the process of discovering and acquiring premium watches as seamless and reliable as possible.
        </p>
        <p>
          Whether you are searching for a rare vintage classic or the latest modern chronograph, we are dedicated to providing a curated marketplace that prioritizes transparency, expertise, and a true passion for horology.
        </p>
      </section>

      <section className="about-team">
        <h2>Our Team</h2>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-avatar">E</div>
            <h3>Employee Employeeoğlu</h3>
            <p className="team-role">Founder & CEO</p>
            <p>A lifelong horology enthusiast who founded Saatinden to bring trust and accessibility to the premium watch market.</p>
          </div>
          <div className="team-card">
            <div className="team-avatar">E</div>
            <h3>Employee Employeeoğlu</h3>
            <p className="team-role">Head of Curation</p>
            <p>An expert appraiser and watchmaker, ensuring every timepiece that crosses our desks meets strict authenticity standards.</p>
          </div>
          <div className="team-card">
            <div className="team-avatar">E</div>
            <h3>Employee Employeeoğlu</h3>
            <p className="team-role">Lead Developer</p>
            <p>The technical architect behind our secure, lightning-fast platform that makes browsing and buying watches a breeze.</p>
          </div>
        </div>
      </section>

      <section className="about-values">
        <h2>What We Stand For</h2>
        <div className="values-grid">
          <div className="value-item">
            <h3>Authenticity</h3>
            <p>Every single watch on our platform undergoes a rigorous inspection by certified experts to guarantee its origin and internal parts.</p>
          </div>
          <div className="value-item">
            <h3>Quality</h3>
            <p>We source only the finest timepieces, meticulously checking their cosmetic condition and mechanical health before they reach your wrist.</p>
          </div>
          <div className="value-item">
            <h3>Trust</h3>
            <p>From transparent pricing to fully insured shipping, we build lasting relationships with our collectors through unwavering reliability.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;