// src/pages/Home.js
import Header from '../components/Header';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <Header />
      <main>
        <h2>Welcome to the Walkability Visualizer</h2>
        <p>Select an option below to explore different walkability models:</p>
        <nav>
          <Link to="/comparison">Model Comparison</Link>
          <br />
          <Link to="/map">View Map</Link>
        </nav>
      </main>
    </div>
  );
}

export default Home;
