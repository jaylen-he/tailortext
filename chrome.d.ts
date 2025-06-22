// chrome.d.ts
declare namespace chrome {
    namespace runtime {
        const lastError: { message?: string } | undefined;
        // You can add more runtime properties/methods if needed
    }

    namespace storage {
        interface StorageChange {
            oldValue?: any;
            newValue?: any;
        }

        interface StorageArea {
            get(keys: string | string[] | { [key: string]: any } | null, callback: (items: { [key: string]: any }) => void): void;
            get(keys: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }>;

            set(items: { [key: string]: any }, callback?: () => void): void;
            set(items: { [key: string]: any }): Promise<void>;

            remove(keys: string | string[], callback?: () => void): void;
            remove(keys: string | string[]): Promise<void>;

            clear(callback?: () => void): void;
            clear(): Promise<void>;

            getBytesInUse(keys: string | string[] | null, callback: (bytesInUse: number) => void): void;
            getBytesInUse(keys: string | string[] | null): Promise<number>;
        }
        
        const local: StorageArea;
        const sync: StorageArea;
        const managed: StorageArea;
        const session: StorageArea; // Requires Chrome 99+ and "session" permission

        const onChanged: {
            addListener(callback: (changes: { [key: string]: StorageChange }, areaName: "sync" | "local" | "managed" | "session") => void): void;
        };
    }

    namespace tabs {
        interface Tab {
            id?: number;
            index: number;
            windowId: number;
            openerTabId?: number;
            selected: boolean;
            highlighted: boolean;
            active: boolean;
            pinned: boolean;
            audible?: boolean;
            discarded: boolean;
            autoDiscardable: boolean;
            mutedInfo?: MutedInfo;
            url?: string;
            pendingUrl?: string;
            title?: string;
            favIconUrl?: string;
            status?: "loading" | "complete";
            incognito: boolean;
            width?: number;
            height?: number;
            sessionId?: string;
            groupId?: number; // Requires Chrome 88+
        }

        interface MutedInfo {
            muted: boolean;
            reason?: "user" | "capture" | "extension";
            extensionId?: string;
        }
        
        interface QueryInfo {
            active?: boolean;
            pinned?: boolean;
            audible?: boolean;
            muted?: boolean;
            highlighted?: boolean;
            discarded?: boolean;
            autoDiscardable?: boolean;
            currentWindow?: boolean;
            lastFocusedWindow?: boolean;
            status?: "loading" | "complete";
            title?: string;
            url?: string | string[];
            windowId?: number;
            windowType?: "normal" | "popup" | "panel" | "app" | "devtools";
            index?: number;
            groupId?: number; // Requires Chrome 88+
        }

        function query(queryInfo: QueryInfo, callback: (result: Tab[]) => void): void;
        function query(queryInfo: QueryInfo): Promise<Tab[]>;
    }

    namespace scripting {
        interface InjectionTarget {
            tabId: number;
            frameIds?: number[];
            documentIds?: string[]; 
        }

        interface ScriptInjection<Args extends any[], Result> {
            args?: Args;
            func: (...args: Args) => Result;
            target: InjectionTarget;
            world?: "ISOLATED" | "MAIN";
            injectImmediately?: boolean;
        }
        
        interface InjectionResult<T = any> {
            frameId: number;
            result: T;
            documentId?: string; 
        }

        function executeScript<Args extends any[], Result>(
            injection: ScriptInjection<Args, Result>,
            callback?: (results: InjectionResult<Result>[]) => void
        ): Promise<InjectionResult<Result>[]>;
    }
}
