
export interface CelestialEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  type: 'Meteor Shower' | 'Eclipse' | 'Conjunction' | 'Supermoon';
  description: string;
  visibility: string;
  image: string;
  status: 'Upcoming' | 'Ongoing' | 'Past';
}

export interface SpaceMission {
  id: string;
  mission_name: string;
  year: number;
  photo: string;
  objective: string;
  country: string;
  status: 'Success' | 'Failure' | 'Active';
}

export interface WeatherMetric {
  id: string;
  label: string;
  value: number;
  max: number;
  unit: string;
  description: string;
  color: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer: number;
}

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  image: string;
  content: string;
}
