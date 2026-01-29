import React, { useMemo } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { FRACTAL_CURRICULUM, FractalLesson } from '../../data/curriculum';
import LegitimacyBadge from './LegitimacyBadge';
import { BookOpen as BookOpenIcon, Clock as ClockIcon, ArrowRight as ArrowRightIcon, ShieldCheck, Link as LinkIcon } from 'lucide-react';
import TermHighlight from '../glossary/TermHighlight';
import QuizComponent from '../assessment/QuizComponent';
import IntelOverlay from './IntelOverlay';

const ContentPane: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();

  const { lesson, nextLesson, prevLesson } = useMemo(() => {
    let foundLesson: (FractalLesson & { moduleTitle: string; moduleFocus: string; phase: string; }) | undefined;
    let next: FractalLesson | undefined;
    let prev: FractalLesson | undefined;

    const allLessons = FRACTAL_CURRICULUM.flatMap(m => m.lessons);
    const lessonIndex = allLessons.findIndex(l => l.id === unitId);

    if (lessonIndex !== -1) {
      const found = allLessons[lessonIndex];
      const module = FRACTAL_CURRICULUM.find(m => m.lessons.some(l => l.id === unitId))!;
      foundLesson = { ...found, moduleTitle: module.title, moduleFocus: module.focus, phase: module.phase };
      next = allLessons[lessonIndex + 1];
      prev = allLessons[lessonIndex - 1];
    }

    return { lesson: foundLesson, nextLesson: next, prevLesson: prev };
  }, [unitId]);

  if (!lesson) {
    return <div className="text-center text-slate p-8">Loading lesson data or lesson not found...</div>;
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20 text-pure-white">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-slate text-xs font-bold uppercase tracking-widest mb-2">
          <span>{lesson.phase}</span>
          <span>/</span>
          <span>{lesson.moduleTitle}</span>
        </div>
        <h1 className="text-4xl font-serif font-bold text-pure-white mb-4 leading-tight">
          {lesson.id}: {lesson.title}
        </h1>
        
        <div className="flex flex-wrap gap-4 items-center text-sm text-slate mb-6">
          <div className="flex items-center space-x-1.5">
            <ClockIcon size={16} />
            <span>Duration: 5h</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <BookOpenIcon size={16} />
            <span>Prerequisites: ✓ 1.1, 1.2</span>
          </div>
        </div>

        <LegitimacyBadge score={94} sources={12} />
      </div>

      <div className="prose prose-slate max-w-none">
        <div className="bg-obsidian-inset border border-slate/20 p-8 rounded-sm shadow-sm mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-pure-white mb-4 border-b border-slate/20 pb-2 flex items-center">
              <ShieldCheck size={24} className="mr-3 text-circuit-orange" />
              Tactical Concept: {lesson.tacticalConcept}
            </h2>
            <p className="text-slate text-lg leading-relaxed italic border-l-2 border-slate/30 pl-4">
              Analyzing {lesson.title} within the framework of {lesson.moduleTitle.toLowerCase()}. Bespoke operational analysis of {lesson.tacticalConcept.toLowerCase()} mechanics.
            </p>
          </div>
          
          {lesson.doctrinalFoundation ? (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif font-bold text-pure-white mb-3">I. Doctrinal Foundation</h3>
                <p className="text-slate text-lg leading-relaxed">{lesson.doctrinalFoundation}</p>
              </section>

              <section>
                <h3 className="text-xl font-serif font-bold text-pure-white mb-3">II. Operational Mechanics</h3>
                <p className="text-slate text-lg leading-relaxed">{lesson.operationalMechanics}</p>
              </section>

              <section className="bg-deep-void p-6 rounded-sm border-l-4 border-circuit-orange">
                <h3 className="text-sm font-bold text-circuit-orange uppercase tracking-wider mb-3 flex items-center">
                  <ShieldCheck size={16} className="mr-2" /> III. Historical Validator & Deep Dive
                </h3>
                <p className="text-slate italic font-serif text-lg mb-4">
                  "{lesson.historicalValidator}"
                </p>
                <p className="text-slate text-lg leading-relaxed">{lesson.historicalDeepDive}</p>
              </section>

              <section>
                <h3 className="text-xl font-serif font-bold text-pure-white mb-3">IV. Contemporary Relevance</h3>
                <p className="text-slate text-lg leading-relaxed">{lesson.contemporaryRelevance}</p>
              </section>

              <section className="border-t border-slate/20 pt-6">
                <h3 className="text-sm font-bold text-slate uppercase tracking-wider mb-3 flex items-center">
                  <LinkIcon size={16} className="mr-2" /> V. Synthesis & Interconnection
                </h3>
                <p className="text-slate text-lg leading-relaxed mb-6">{lesson.synthesis}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prevLesson && (
                    <NavLink to={`/unit/${prevLesson.id}`} className="p-4 bg-deep-void border border-slate/10 rounded-sm hover:border-circuit-orange/50 transition-colors group">
                      <div className="text-[10px] font-bold text-slate uppercase mb-1">Previous Lesson</div>
                      <div className="text-pure-white font-serif group-hover:text-circuit-orange transition-colors">{prevLesson.title}</div>
                    </NavLink>
                  )}
                  {nextLesson && (
                    <NavLink to={`/unit/${nextLesson.id}`} className="p-4 bg-deep-void border border-slate/10 rounded-sm hover:border-circuit-orange/50 transition-colors group text-right">
                      <div className="text-[10px] font-bold text-slate uppercase mb-1">Next Lesson</div>
                      <div className="text-pure-white font-serif group-hover:text-circuit-orange transition-colors">{nextLesson.title}</div>
                    </NavLink>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {lesson.tacticalAnalysis ? (
                  lesson.tacticalAnalysis.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-slate text-lg leading-relaxed">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-slate text-lg leading-relaxed">
                    This unit explores the foundational mechanics of {lesson.title}.
                    Understanding <TermHighlight term={lesson.tacticalConcept}>{lesson.tacticalConcept}</TermHighlight> is critical for operational analysis
                    within the {lesson.phase.toLowerCase()} track of {lesson.moduleTitle}.
                  </p>
                )}
              </div>

              <div className="bg-deep-void p-6 rounded-sm border-l-4 border-circuit-orange mb-6">
                <h3 className="text-sm font-bold text-circuit-orange uppercase tracking-wider mb-2 flex items-center">
                  <ShieldCheck size={16} className="mr-2" /> Historical Validator
                </h3>
                <p className="text-slate italic font-serif text-lg">
                  "{lesson.historicalValidator}"
                </p>
              </div>
            </>
          )}
        </div >

        {lesson.caseStudy && (
          <div className="bg-obsidian-inset border-t-4 border-circuit-orange shadow-md p-8 rounded-sm relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
            <div className="absolute top-0 right-0 bg-circuit-orange text-black px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
              Case Study
            </div>
            <h3 className="text-xl font-serif font-bold text-pure-white mb-2">
              {lesson.caseStudy.split('/').pop()?.replace('.md', '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </h3>
            <p className="text-slate text-sm mb-6 max-w-2xl">
              A deep dive into the practical application of {lesson.tacticalConcept} 
              within historical and modern contexts.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex space-x-6 text-xs font-bold text-slate uppercase tracking-wider">
                <span>Sources: 8</span>
                <span>Legitimacy: 96%</span>
              </div>
              <div className="flex items-center space-x-2 text-circuit-orange font-bold text-sm">
                <span>Begin Case Study</span>
                <ArrowRightIcon size={16} />
              </div>
            </div>
          </div>
        )}

        {/* Quiz section - show it for some units to demonstrate */}
        {lesson.id === 'L01' && <QuizComponent />}

        <IntelOverlay topic={lesson.title} content={lesson.tacticalConcept} />
      </div>
    </div>
  );
};

export default ContentPane;
