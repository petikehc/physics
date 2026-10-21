import { controller } from './controller';
import { CHAPTERS } from '../chapters/registry';
import { ConstellationIndex } from '../chapters/finale/ui/ConstellationIndex';

/** At the end of the journey: the constellation, left in the sky as the index of the chapters. */
export function EndCard() {
  return (
    <ConstellationIndex
      where="journey"
      onPlay={(slug) => {
        controller.gotoChapter(slug);
        controller.play();
      }}
      onReplay={() => {
        controller.gotoChapter(CHAPTERS[0]!.slug);
        controller.play();
      }}
    />
  );
}
