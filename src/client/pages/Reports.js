"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_query_1 = require("@tanstack/react-query");
const api_1 = require("../../client/api");
const ui_1 = require("../../components/ui");
const separator_1 = require("../../components/ui/separator");
const lucide_react_1 = require("lucide-react");
function Reports() {
    // Fetch reports
    const { data: reports = [], isLoading } = (0, react_query_1.useQuery)({
        queryKey: ['reports'],
        queryFn: api_1.apiClient.listReports,
    });
    return (react_1.default.createElement("div", { className: "space-y-6" },
        react_1.default.createElement("div", null,
            react_1.default.createElement("h1", { className: "text-3xl font-bold tracking-tight" }, "\u041E\u0442\u0447\u0435\u0442\u044B"),
            react_1.default.createElement("p", { className: "text-muted-foreground" }, "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u043E\u0442\u0447\u0435\u0442\u043E\u0432")),
        react_1.default.createElement(separator_1.Separator, null),
        isLoading ? (react_1.default.createElement("div", { className: "space-y-4" }, Array.from({ length: 3 }).map((_, i) => (react_1.default.createElement(ui_1.Card, { key: i },
            react_1.default.createElement(ui_1.CardHeader, null,
                react_1.default.createElement(ui_1.Skeleton, { className: "h-6 w-3/4" })),
            react_1.default.createElement(ui_1.CardContent, null,
                react_1.default.createElement(ui_1.Skeleton, { className: "h-4 w-full" }),
                react_1.default.createElement(ui_1.Skeleton, { className: "h-4 w-3/4 mt-2" }))))))) : reports.length === 0 ? (react_1.default.createElement(ui_1.Card, null,
            react_1.default.createElement(ui_1.CardContent, { className: "flex flex-col items-center justify-center p-6" },
                react_1.default.createElement(lucide_react_1.FileSpreadsheet, { className: "h-12 w-12 text-muted-foreground mb-4" }),
                react_1.default.createElement("h3", { className: "text-lg font-medium" }, "\u041D\u0435\u0442 \u043E\u0442\u0447\u0435\u0442\u043E\u0432"),
                react_1.default.createElement("p", { className: "text-sm text-muted-foreground text-center mt-1" }, "\u0421\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u0443\u0439\u0442\u0435 \u043E\u0442\u0447\u0435\u0442 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u0414\u0430\u0448\u0431\u043E\u0440\u0434")))) : (react_1.default.createElement("div", { className: "space-y-4" }, reports.map((report) => (react_1.default.createElement(ui_1.Card, { key: report.id },
            react_1.default.createElement(ui_1.CardHeader, null,
                react_1.default.createElement(ui_1.CardTitle, null, report.name),
                react_1.default.createElement(ui_1.CardDescription, null,
                    "\u0421\u043E\u0437\u0434\u0430\u043D: ",
                    new Date(report.createdAt).toLocaleString("ru-RU"))),
            react_1.default.createElement(ui_1.CardContent, null,
                react_1.default.createElement("div", { className: "space-y-2" },
                    react_1.default.createElement("div", { className: "flex items-center" },
                        react_1.default.createElement(lucide_react_1.Calendar, { className: "h-4 w-4 mr-2 text-muted-foreground" }),
                        react_1.default.createElement("span", { className: "text-sm" },
                            "\u041F\u0435\u0440\u0438\u043E\u0434:",
                            " ",
                            new Date(report.dateFrom).toLocaleDateString("ru-RU"),
                            " -",
                            " ",
                            new Date(report.dateTo).toLocaleDateString("ru-RU"))),
                    react_1.default.createElement("div", { className: "flex items-center" },
                        react_1.default.createElement(lucide_react_1.FileText, { className: "h-4 w-4 mr-2 text-muted-foreground" }),
                        react_1.default.createElement("span", { className: "text-sm" },
                            "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0437\u0430\u043F\u0438\u0441\u0435\u0439: ",
                            report.itemCount)),
                    report.keywordsUsed && (react_1.default.createElement("div", { className: "flex items-center" },
                        react_1.default.createElement(lucide_react_1.Search, { className: "h-4 w-4 mr-2 text-muted-foreground" }),
                        react_1.default.createElement("span", { className: "text-sm" },
                            "\u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0441\u043B\u043E\u0432\u0430: ",
                            report.keywordsUsed))))),
            react_1.default.createElement(ui_1.CardFooter, null,
                react_1.default.createElement(ui_1.Button, { variant: "outline", onClick: () => window.open(report.fileUrl, "_blank") },
                    react_1.default.createElement(lucide_react_1.Download, { className: "mr-2 h-4 w-4" }),
                    "\u0421\u043A\u0430\u0447\u0430\u0442\u044C Excel")))))))));
}
exports.default = Reports;
