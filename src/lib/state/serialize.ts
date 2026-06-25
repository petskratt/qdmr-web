// JSON (de)serialization for datasets. The model embeds `TaggedValue` class
// instances (for `!default` / `!selected`); plain JSON and IndexedDB's structured
// clone would drop the prototype, so we encode them with an explicit marker and
// revive them on read.

import { TaggedValue, type Dataset } from '../model/types';

interface TaggedMarker {
	$qdmrTag: string;
	value: unknown;
}

function isTaggedMarker(v: unknown): v is TaggedMarker {
	return typeof v === 'object' && v !== null && '$qdmrTag' in v;
}

export function serializeDataset(ds: Dataset): string {
	return JSON.stringify(ds, (_key, value) => {
		if (value instanceof TaggedValue) {
			return { $qdmrTag: value.tag, value: value.value } satisfies TaggedMarker;
		}
		return value;
	});
}

export function deserializeDataset(text: string): Dataset {
	return JSON.parse(text, (_key, value) => {
		if (isTaggedMarker(value)) {
			return new TaggedValue(value.$qdmrTag, value.value as never);
		}
		return value;
	}) as Dataset;
}
