import React from 'react';
import { Card } from '../ui';

export type GameProps = {
  title?: string;
  description?: string;
  rules?: string[];
  scenarios?: { title: string; prompt: string; good?: string; bad?: string }[];
};

export default function GameSection({ title = 'Deal Desk Challenge', description, rules = [], scenarios = [] }: GameProps) {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h2>
        {description && <p className="muted mb-6">{description}</p>}
        {rules.length > 0 && (
          <Card className="p-4 sm:p-6 mb-6">
            <div className="font-semibold mb-2">How it works</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {rules.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </Card>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scenarios.map((s, i) => (
            <Card key={i} className="p-4">
              <div className="text-lg font-semibold">{s.title}</div>
              <p className="muted mt-1">{s.prompt}</p>
              {(s.good || s.bad) && (
                <div className="mt-3 text-sm">
                  {s.good && <div><span className="font-medium">Good:</span> {s.good}</div>}
                  {s.bad && <div><span className="font-medium">Avoid:</span> {s.bad}</div>}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}