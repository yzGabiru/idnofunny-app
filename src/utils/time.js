export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';

  // 1. O Backend manda UTC (ex: "2026-01-04T15:00:00") mas sem o "Z".
  // Se não tiver "Z", adicionamos para o navegador saber que é UTC e converter pro seu horário local.
  const dateValue = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(dateValue);
  const now = new Date();

  // Calcula a diferença em segundos
  const seconds = Math.floor((now - date) / 1000);

  // Tratamento para relógios desajustados ou pequenas diferenças (posts do "futuro")
  if (seconds < 0) return 'Agora mesmo';

  // Lógica de tempo
  if (seconds < 60) return 'Agora mesmo';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} d`;

  if (days < 30) return `há ${Math.floor(days / 7)} sem`;

  // Se faz muito tempo, mostra a data normal (ex: 04/01/2026)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};