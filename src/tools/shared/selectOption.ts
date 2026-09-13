import { By, type WebDriver, type WebElement } from "selenium-webdriver";

export type OptionChoice = {
    text?: string | undefined;
    value?: string | undefined;
    index?: number | undefined;
};

export type SelectedOption = {
    index: number;
    text: string;
    value: string;
};

type DropdownOption = SelectedOption & {
    disabled: boolean;
    selected: boolean;
};

type DropdownState = {
    disabled: boolean;
    multiple: boolean;
    options: DropdownOption[];
};

const MAX_LISTED_OPTIONS = 25;

// Reads the whole <select> in one round trip. Returns null when the element is not a <select>.
const READ_DROPDOWN_SCRIPT = `
    const select = arguments[0];
    if (!select || select.tagName.toLowerCase() !== "select") {
        return null;
    }

    return {
        disabled: select.disabled,
        multiple: select.multiple,
        options: Array.from(select.options).map((option) => ({
            index: option.index,
            text: option.text.trim(),
            value: option.value,
            disabled: option.disabled || Boolean(option.closest("optgroup")?.disabled),
            selected: option.selected
        }))
    };
`;

async function readDropdown(driver: WebDriver, element: WebElement): Promise<DropdownState> {
    const state = await driver.executeScript<DropdownState | null>(READ_DROPDOWN_SCRIPT, element);

    if (!state) {
        const tagName = await element.getTagName();
        throw new Error(
            `Element is not a <select> dropdown (found <${tagName}>). For custom dropdowns, click the trigger and then the option instead.`
        );
    }

    return state;
}

function describeChoice(choice: OptionChoice): string {
    if (choice.text !== undefined) {
        return `text "${choice.text}"`;
    }

    if (choice.value !== undefined) {
        return `value "${choice.value}"`;
    }

    return `index ${choice.index}`;
}

function matchesChoice(option: DropdownOption, choice: OptionChoice): boolean {
    if (choice.text !== undefined) {
        return option.text === choice.text.trim();
    }

    if (choice.value !== undefined) {
        return option.value === choice.value;
    }

    return option.index === choice.index;
}

function listOptions(options: DropdownOption[]): string {
    const listed = options
        .slice(0, MAX_LISTED_OPTIONS)
        .map(
            (option) =>
                `${option.index}: "${option.text}" (value "${option.value}")${option.disabled ? " [disabled]" : ""}`
        );

    if (options.length > MAX_LISTED_OPTIONS) {
        listed.push(`...and ${options.length - MAX_LISTED_OPTIONS} more`);
    }

    return listed.join(", ");
}

export function assertSingleChoice(choice: OptionChoice): void {
    const provided = [choice.text, choice.value, choice.index].filter((part) => part !== undefined).length;

    if (provided !== 1) {
        throw new Error("Provide exactly one of text, value, or index to choose the option.");
    }
}

export async function selectOption(
    driver: WebDriver,
    element: WebElement,
    choice: OptionChoice
): Promise<{ multiple: boolean; selected: SelectedOption[] }> {
    assertSingleChoice(choice);

    const dropdown = await readDropdown(driver, element);

    if (dropdown.disabled) {
        throw new Error("The dropdown is disabled.");
    }

    const match = dropdown.options.find((option) => matchesChoice(option, choice));

    if (!match) {
        throw new Error(
            `No option matches ${describeChoice(choice)}. Available options: ${listOptions(dropdown.options)}.`
        );
    }

    if (match.disabled) {
        throw new Error(`The option matching ${describeChoice(choice)} is disabled.`);
    }

    // Click the option like a user would, so change/input events fire. Skipping an already
    // selected option matters for multi-selects, where a click would toggle it off.
    if (!match.selected) {
        const optionElements = await element.findElements(By.css("option"));
        const target = optionElements[match.index];

        if (!target) {
            throw new Error(`Could not locate the option element at index ${match.index}.`);
        }

        await target.click();
    }

    const after = await readDropdown(driver, element);

    return {
        multiple: after.multiple,
        selected: after.options
            .filter((option) => option.selected)
            .map(({ index, text, value }) => ({ index, text, value }))
    };
}
