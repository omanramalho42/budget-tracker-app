type WelcomeEmailData = {
  email: string;
  name: string;
  intro: string;
};

type RawNewsArticle = {
  id: number;
  headline?: string;
  summary?: string;
  source?: string;
  url?: string;
  datetime?: number;
  image?: string;
  category?: string;
  related?: string;
};

type MarketNewsArticle = {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  category: string;
  related: string;
  image?: string;
};

type UserForNewsEmail = {
  email: string;
  name?: string | null;
  country?: string | null;
  investmentGoals?: string | null;
  riskTolerance?: string | null;
}