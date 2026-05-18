import { format, isToday, isTomorrow, isThisWeek, nextSunday } from "date-fns";
import { fr } from "date-fns/locale";

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Hey ${name} ☀️`;
  if (hour < 18) return `Salut ${name} 👋`;
  return `Bonsoir ${name} 🌙`;
}

export function getServiceCountMessage(count: number): string {
  if (count === 1) return "Premier service ce mois — bienvenue 🌱";
  if (count <= 3) return `${count}e service ce mois, merci 🙏`;
  return `${count}e service ce mois — tu es une star 🌟`;
}

export function formatServiceDate(date: Date): string {
  if (isToday(date)) {
    return `Aujourd'hui à ${format(date, "HH'h'mm", { locale: fr })}`;
  }
  if (isTomorrow(date)) {
    return `Demain à ${format(date, "HH'h'mm", { locale: fr })}`;
  }
  return format(date, "EEEE d MMMM 'à' HH'h'mm", { locale: fr });
}

export function formatDateShort(date: Date): string {
  return format(date, "d MMMM", { locale: fr });
}

export function getConfirmationMessage(name: string, role: string): string {
  return `Hey ${name}, dimanche tu seras à la ${role}. Tu confirmes ? 🙌`;
}

export function getReminderMessage(name: string, arrivalTime: string): string {
  return `Rappel doux : demain, arrivée à ${arrivalTime}. À demain ${name} 🙏`;
}

export function getThanksMessage(name: string): string {
  const messages = [
    `Merci ${name}, tu as assuré aujourd'hui ! 🌟`,
    `Beau service ${name}, merci d'avoir été là 🙏`,
    `${name}, ton engagement fait toute la différence. Merci ! ✨`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
