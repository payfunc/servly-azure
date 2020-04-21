import * as process from "process"
import { Context, HttpRequest } from "@azure/functions"
import * as servly from "servly"

export class Request implements servly.Request {
	readonly method: servly.Request.Method | undefined
	readonly url: string
	readonly baseUrl: string
	readonly query: { [key: string]: string; }
	readonly parameter: { [key: string]: string; }
	get remote(): string | undefined { return (this.backend.params.MS_HttpContext as any as { request: { userHostAddress: string } })?.request?.userHostAddress }
	readonly header: servly.Request.Header
	readonly raw: Promise<any>
	constructor(private readonly context: Context, private readonly backend: HttpRequest) {
		this.method = this.backend && this.backend.method || undefined
		this.url = this.backend && this.backend.url || ""
		if (process.env.baseUrl)
			this.url = process.env.baseUrl + (this.url && this.url.slice(this.url.split("/", this.url.includes("//") ? 3 : 1).join("/").length))
		else if (this.url.startsWith("http://") && !this.url.startsWith("http://localhost")) // TODO: Fix for bug in Azure
			this.url = "https:" + this.url.slice(5)
		this.baseUrl = this.url.split("/", this.url.includes("//") ? 3 : 1).join("/")
		this.query = this.backend && this.backend.query || {}
		this.parameter = this.backend && this.backend.params || {}
		this.header = this.backend && servly.Request.Header.from(this.backend.headers) || {}
		this.raw = this.backend && Promise.resolve(this.backend.rawBody)
	}
	log(message?: any, ...parameters: any[]): void {
		this.context.log(format(message), parameters.map(format))
	}
	protected toJSON(): Omit<servly.Request, "log" | "baseUrl"> {
		return {
			method: this.method,
			url: this.url,
			query: this.query,
			parameter: this.parameter,
			remote: this.remote,
			header: this.header,
		}
	}
}
const log = console.log
console.log = (message?: any, ...parameters: any[]) => {
	log(format(message), parameters.map(format))
}
function format(value: any): string {
	let result: string
	switch (typeof value) {
		default:
		case "object":
			result = JSON.stringify(value)
			break
		case "number":
			result = value.toString()
			break
		case "string":
			result = value
			break
	}
	return result.replace("\n", " ")
}
