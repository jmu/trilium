import BasicWidget from "./basic_widget.js";
import appContext from "../services/app_context.js";

export default class TabAwareWidget extends BasicWidget {
    setTabContextEvent({tabContext}) {
        /** @var {TabContext} */
        this.tabContext = tabContext;
    }

    isTab(tabId) {
        return this.tabContext && this.tabContext.tabId === tabId;
    }

    isNote(noteId) {
        return this.noteId === noteId;
    }

    get note() {
        return this.tabContext && this.tabContext.note;
    }

    get noteId() {
        return this.note && this.note.noteId;
    }

    get notePath() {
        return this.tabContext && this.tabContext.notePath;
    }

    async tabNoteSwitchedEvent({tabId, notePath}) {
        // if notePath does not match then the tabContext has been switched to another note in the mean time
        if (this.isTab(tabId) && this.notePath === notePath) {
            await this.noteSwitched();
        }
    }

    async noteTypeMimeChangedEvent({noteId}) {
        if (this.noteId === noteId) {
            await this.refresh();
        }
    }

    async noteSwitched() {
        await this.refresh();
    }

    async activeTabChanged() {
        await this.refresh();
    }

    isEnabled() {
        return !!this.note && this.tabContext.isActive();
    }

    async refresh() {
        if (this.isEnabled()) {
            const start = Date.now();

            this.toggle(true);
            await this.refreshWithNote(this.note, this.notePath);

            const end = Date.now();

            if (glob.PROFILING_LOG && end - start > 10) {
                console.log(`Refresh of ${this.componentId} took ${end-start}ms`);
            }
        }
        else {
            this.toggle(false);
        }
    }

    async refreshWithNote(note, notePath) {}

    async activeTabChangedEvent({tabId}) {
        this.tabContext = appContext.tabManager.getTabContextById(tabId);

        if (this.tabContext.tabId === appContext.tabManager.getActiveTabContext().tabId) {
            await this.activeTabChanged();
        }
    }

    // when note is both switched and activated, this should not produce double refresh
    async tabNoteSwitchedAndActivatedEvent({tabId, notePath}) {
        this.tabContext = appContext.tabManager.getTabContextById(tabId);

        if (this.tabContext.tabId === appContext.tabManager.getActiveTabContext().tabId
            && this.notePath === notePath) {

            this.tabContext = appContext.tabManager.getActiveTabContext();

            await this.refresh();
        }
    }

    async treeCacheReloadedEvent() {
        await this.refresh();
    }

    async lazyLoadedEvent() {
        if (!this.tabContext) { // has not been loaded yet
            this.tabContext = appContext.tabManager.getActiveTabContext();
        }

        await this.refresh();
    }
}