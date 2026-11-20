import { PIPELINE_STEPS } from '../../data/pipelineSteps.js';
import { GitBranchIcon, SearchIcon, ChecklistIcon } from '../icons.jsx';

// Ключ icon из данных → компонент иконки.
const ICONS = {
  git: GitBranchIcon,
  search: SearchIcon,
  checklist: ChecklistIcon,
};

export default function PipelineSteps() {
  return (
    <section className="card" id="how" aria-labelledby="how-title">
      <header className="card__header">
        <h2 className="card__title" id="how-title">
          Как это работает
        </h2>
      </header>

      <ol className="steps card__body">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = ICONS[step.icon];
          return (
            <li className="steps__item" key={step.id}>
              <span className="steps__num">{index + 1}</span>
              <div>
                <h3 className="steps__title">
                  <Icon size={18} />
                  {step.title}
                </h3>
                <p className="steps__text">{step.text}</p>
                <ul className="chips">
                  {step.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
