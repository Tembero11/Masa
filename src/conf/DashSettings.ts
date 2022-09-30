export default interface DashSettings {
    users?: DashUser[]
}
export interface DashUser {
    username: string
    password: string
}