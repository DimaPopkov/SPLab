import Hero from './home/Hero.jsx';
import UserStatsCard from './home/UserStatsCard.jsx';
import AboutCard from './home/AboutCard.jsx';
import PipelineSteps from './home/PipelineSteps.jsx';
import FrameworkTable from './home/FrameworkTable.jsx';

import '../styles/home.css';

export default function HomePage() {
  return (
    <>
      <Hero />

      <div className="container home-layout">
        <aside className="home-layout__side">
          <UserStatsCard />
        </aside>

        <div className="home-layout__main">
          <AboutCard />
          <PipelineSteps />
          <FrameworkTable />
        </div>
      </div>
    </>
  );
}
