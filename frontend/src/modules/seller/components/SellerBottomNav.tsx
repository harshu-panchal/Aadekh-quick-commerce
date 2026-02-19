import { useNavigate, useLocation } from "react-router-dom";

interface SellerBottomNavProps {
    onMenuClick: () => void;
}

export default function SellerBottomNav({ onMenuClick }: SellerBottomNavProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === "/seller") {
            return location.pathname === "/seller" || location.pathname === "/seller/";
        }
        return location.pathname.startsWith(path);
    };

    const navItems = [
        {
            label: "Home",
            path: "/seller",
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
        },
        {
            label: "Orders",
            path: "/seller/orders",
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
            ),
        },
        {
            label: "Add",
            path: "/seller/product/add",
            isCenter: true,
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            ),
        },
        {
            label: "Wallet",
            path: "/seller/wallet",
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
            ),
        },
        {
            label: "Menu",
            onClick: onMenuClick,
            icon: (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
            ),
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-2 py-1 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-end max-w-lg mx-auto h-14">
                {navItems.map((item, index) => {
                    const active = item.path ? isActive(item.path) : false;

                    if (item.isCenter) {
                        return (
                            <button
                                key={index}
                                onClick={() => navigate(item.path!)}
                                className="relative -top-5 flex flex-col items-center justify-center"
                            >
                                <div className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${active ? "bg-teal-700 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
                                    }`}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-medium mt-1 text-neutral-500">{item.label}</span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => (item.path ? navigate(item.path) : item.onClick?.())}
                            className={`flex flex-col items-center justify-center w-full transition-colors ${active ? "text-teal-600" : "text-neutral-500 hover:text-teal-600"
                                }`}
                        >
                            <div className="mb-1">{item.icon}</div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
