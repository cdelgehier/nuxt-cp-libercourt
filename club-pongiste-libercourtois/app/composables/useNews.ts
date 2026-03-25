/**
 * Composable for news-related utilities
 */
export const useNews = () => {
  /**
   * Get badge color classes based on news source
   */
  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case "comite":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ligue":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "facebook":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  /**
   * Get icon name based on news source
   */
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "comite":
        return "i-heroicons-newspaper";
      case "ligue":
        return "i-heroicons-globe-alt";
      case "facebook":
        return "i-heroicons-chat-bubble-left-right";
      default:
        return "i-heroicons-document-text";
    }
  };

  /**
   * Get readable label based on news source
   */
  const getSourceLabel = (source: string) => {
    switch (source) {
      case "comite":
        return "Comité CD62TT";
      case "ligue":
        return "Ligue HDF";
      case "facebook":
        return "Facebook";
      default:
        return "Actualité";
    }
  };

  /**
   * Format date to French locale
   */
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  return {
    getSourceBadgeClass,
    getSourceIcon,
    getSourceLabel,
    formatDate,
  };
};
