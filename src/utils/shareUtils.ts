export const handleTwitterShare = (conversationId: string) => {
  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}/share/${conversationId}`;
  const text = '来看看我在「智柜」上做的柜子方案!';
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
    '_blank',
    'noopener,noreferrer',
  );
};

export const handleFacebookShare = (conversationId: string) => {
  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}/share/${conversationId}`;
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    '_blank',
    'noopener,noreferrer',
  );
};

export const handleWhatsAppShare = (conversationId: string) => {
  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}/share/${conversationId}`;
  const text = '来看看我在「智柜」上做的柜子方案!';
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
    '_blank',
    'noopener,noreferrer',
  );
};
