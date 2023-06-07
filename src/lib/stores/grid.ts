import { writable } from 'svelte/store';
import { Grid } from '../models/grid';

export const gridStore = writable(new Grid([]));
