export class NetflixShow {
    constructor(
        public show_id: string,
        public type: string | null,
        public title: string | null,
        public director: string | null,
        public cast_members: string | null,
        public country: string | null,
        public date_added: Date | null,
        public release_year: number | null,
        public rating: string | null,
        public duration: string | null,
        public listed_in: string | null,
        public description: string | null,
    ) { }
}
