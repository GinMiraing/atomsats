const Footer: React.FC = () => {
  return (
    <footer className="flex w-full flex-col items-center space-y-3 border-t bg-secondary px-4 py-8">
      <div>© 2024 AtomSats</div>
      <div className="text-sm">Unlock Your Atomical NFT Ecosystem</div>
      <div className="flex items-center space-x-4 text-sm">
        <a
          href="https://t.me/atomsats"
          target="_blank"
          rel="noreferrer"
          className="text-primary transition-colors hover:text-theme"
        >
          Telegram
        </a>
        <a
          href="https://twitter.com/atomsats"
          target="_blank"
          rel="noreferrer"
          className="text-primary transition-colors hover:text-theme"
        >
          Twitter
        </a>
      </div>
    </footer>
  );
};

export default Footer;
