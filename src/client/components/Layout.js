"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const ui_1 = require("../../components/ui");
const lucide_react_1 = require("lucide-react");
const framer_motion_1 = require("framer-motion");
function Layout({ children }) {
    const location = (0, react_router_dom_1.useLocation)();
    return (react_1.default.createElement("div", { className: "min-h-screen bg-background" },
        react_1.default.createElement("div", { className: "flex min-h-screen" },
            react_1.default.createElement("div", { className: "hidden md:flex w-64 flex-col border-r bg-card" },
                react_1.default.createElement("div", { className: "p-6" },
                    react_1.default.createElement("h1", { className: "text-2xl font-bold text-foreground" }, "TaxNewsRadar"),
                    react_1.default.createElement("p", { className: "text-sm text-muted-foreground mt-1" }, "\u041D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0439 \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433")),
                react_1.default.createElement("nav", { className: "flex-1 px-4 space-y-1" },
                    react_1.default.createElement(react_router_dom_1.Link, { to: "/" },
                        react_1.default.createElement(ui_1.Button, { variant: location.pathname === "/" ? "secondary" : "ghost", className: "w-full justify-start" },
                            react_1.default.createElement(lucide_react_1.Home, { className: "mr-2 h-4 w-4" }),
                            "\u0414\u0430\u0448\u0431\u043E\u0440\u0434")),
                    react_1.default.createElement(react_router_dom_1.Link, { to: "/settings" },
                        react_1.default.createElement(ui_1.Button, { variant: location.pathname === "/settings" ? "secondary" : "ghost", className: "w-full justify-start" },
                            react_1.default.createElement(lucide_react_1.Settings, { className: "mr-2 h-4 w-4" }),
                            "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438")),
                    react_1.default.createElement(react_router_dom_1.Link, { to: "/reports" },
                        react_1.default.createElement(ui_1.Button, { variant: location.pathname === "/reports" ? "secondary" : "ghost", className: "w-full justify-start" },
                            react_1.default.createElement(lucide_react_1.FileSpreadsheet, { className: "mr-2 h-4 w-4" }),
                            "\u041E\u0442\u0447\u0435\u0442\u044B")))),
            react_1.default.createElement("div", { className: "flex-1 flex flex-col overflow-hidden" },
                react_1.default.createElement("header", { className: "md:hidden border-b p-4 bg-card" },
                    react_1.default.createElement("div", { className: "flex items-center justify-between" },
                        react_1.default.createElement("h1", { className: "text-xl font-bold" }, "TaxNewsRadar"),
                        react_1.default.createElement("div", { className: "flex space-x-2" },
                            react_1.default.createElement(react_router_dom_1.Link, { to: "/" },
                                react_1.default.createElement(ui_1.Button, { variant: "ghost", size: "icon" },
                                    react_1.default.createElement(lucide_react_1.Home, { className: "h-5 w-5" }))),
                            react_1.default.createElement(react_router_dom_1.Link, { to: "/settings" },
                                react_1.default.createElement(ui_1.Button, { variant: "ghost", size: "icon" },
                                    react_1.default.createElement(lucide_react_1.Settings, { className: "h-5 w-5" }))),
                            react_1.default.createElement(react_router_dom_1.Link, { to: "/reports" },
                                react_1.default.createElement(ui_1.Button, { variant: "ghost", size: "icon" },
                                    react_1.default.createElement(lucide_react_1.FileSpreadsheet, { className: "h-5 w-5" })))))),
                react_1.default.createElement("main", { className: "flex-1 overflow-auto p-6" },
                    react_1.default.createElement(framer_motion_1.motion.div, { key: location.pathname, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.2 } }, children))))));
}
exports.default = Layout;
