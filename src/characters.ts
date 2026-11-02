/**
 * The korrigan choice (the korrigan or the korriganez): a round portrait per character, acting as
 * one choice (radio buttons), in every `.character-choice` group of the page (the menu, an
 * end-of-level screen). Each `.character-field` around them is hidden while there is only one
 * character. The choice never changes the rules; the game decides what it changes.
 */

export interface CharacterOption {
  id: string;
  /** Its accessible name ("The korriganez"). */
  label: string;
  /** The portrait: a picture of the head, or a square crop of a bigger frame. */
  portrait?: { url: string; crop?: { x: number; y: number; side: number; width: number; height: number } };
}

export interface CharacterChoiceOptions {
  characters: readonly CharacterOption[];
  current: string;
  onChoose: (id: string) => void;
  root?: ParentNode;
}

/** Fills (or refreshes) every character choice of the page. */
export function renderCharacterChoice({ characters, current, onChoose, root = document }: CharacterChoiceOptions): void {
  root.querySelectorAll<HTMLElement>('.character-field').forEach((field) => (field.hidden = characters.length < 2));
  root.querySelectorAll<HTMLElement>('.character-choice').forEach((group) => {
    group.setAttribute('role', 'radiogroup');
    group.replaceChildren(
      ...characters.map((c) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'character-option';
        button.dataset.character = c.id;
        button.setAttribute('role', 'radio');
        button.setAttribute('aria-checked', String(c.id === current));
        button.setAttribute('aria-label', c.label);
        button.title = c.label;
        const p = c.portrait;
        if (p?.crop) {
          // The head of a bigger frame, scaled to the button (as in Pebble Tide).
          const { x, y, side, width, height } = p.crop;
          button.style.backgroundImage = `url("${p.url}")`;
          button.style.backgroundSize = `${(width / side) * 100}% ${(height / side) * 100}%`;
          button.style.backgroundPosition = `${(x / (width - side)) * 100}% ${(y / (height - side)) * 100}%`;
        } else if (p) {
          const img = document.createElement('img');
          img.src = p.url;
          img.alt = '';
          button.append(img);
        }
        button.addEventListener('click', () => onChoose(c.id));
        return button;
      }),
    );
  });
}
