import {
  Dumbbell,
  Flame,
  HeartPulse,
  House,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import type {
  Goal,
  HomeEquipment,
  Intolerance,
  SurveyDraft,
  TrainingPlace,
} from '@/types'

/** Metadane do wyświetlania – wartości (klucze) pochodzą z types/survey.ts. */
interface OptionMeta {
  label: string
  description: string
  icon: LucideIcon
}

export const SURVEY_STEPS = [
  { id: 'goal', label: 'Cel' },
  { id: 'budget', label: 'Budżet' },
  { id: 'equipment', label: 'Sprzęt' },
  { id: 'intolerances', label: 'Nietolerancje' },
] as const
export type SurveyStepId = (typeof SURVEY_STEPS)[number]['id']

export const GOAL_OPTIONS: Record<Goal, OptionMeta> = {
  cut: {
    label: 'Redukcja',
    description: 'Zrzucam tkankę tłuszczową i zachowuję mięśnie.',
    icon: Flame,
  },
  bulk: {
    label: 'Masa',
    description: 'Buduję masę mięśniową w kontrolowanej nadwyżce kalorii.',
    icon: TrendingUp,
  },
  health: {
    label: 'Zdrowie i forma',
    description: 'Utrzymuję wagę, poprawiam kondycję i nawyki.',
    icon: HeartPulse,
  },
}

export const TRAINING_PLACE_OPTIONS: Record<TrainingPlace, OptionMeta> = {
  home: {
    label: 'W domu',
    description: 'Ćwiczę w domu – z własnym sprzętem lub bez.',
    icon: House,
  },
  gym: {
    label: 'Siłownia',
    description: 'Mam dostęp do pełnego wyposażenia siłowni.',
    icon: Dumbbell,
  },
}

export const HOME_EQUIPMENT_LABELS: Record<HomeEquipment, string> = {
  dumbbells: 'Hantle',
  resistance_bands: 'Gumy oporowe',
  pullup_bar: 'Drążek',
  kettlebell: 'Kettlebell',
  bench: 'Ławka',
}

export const INTOLERANCE_LABELS: Record<Intolerance, string> = {
  gluten: 'Gluten',
  lactose: 'Laktoza',
  nuts: 'Orzechy',
  peanuts: 'Orzeszki ziemne',
  eggs: 'Jaja',
  soy: 'Soja',
  fish: 'Ryby',
  shellfish: 'Owoce morza',
}

export const TRAINING_DAYS_OPTIONS = [2, 3, 4, 5, 6] as const

export const BUDGET = {
  min: 100,
  max: 800,
  step: 25,
  default: 300,
  presets: [200, 300, 400, 600],
} as const

export const INITIAL_DRAFT: SurveyDraft = {
  goal: null,
  weeklyBudgetPln: BUDGET.default,
  trainingPlace: null,
  homeEquipment: [],
  trainingDaysPerWeek: 3,
  intolerances: [],
  otherIntolerances: '',
}
