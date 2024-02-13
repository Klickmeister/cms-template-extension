import { CmsDiagnosticEntry } from "../types/diagnosticTypes";
import { CmsContainer } from "../types/containerTypes";
import * as vscode from "vscode";

/**
 * A helper object for working with containers.
 */
const containerHelper = {
  /**
   * Checks if the given text line is the start of a container.
   * @param textline The text line to check.
   * @returns True if the text line is the start of a container, otherwise false.
   */
  isStartOfContainer: (textline: string) => {
    return textline.includes("[container]");
  },

  /**
   * Checks if the given text line is the end of a container.
   * @param textline The text line to check.
   * @returns True if the text line is the end of a container, otherwise false.
   */
  isEndOfContainer: (textline: string) => {
    return textline.includes("[EOcontainer]");
  },

  /**
   * Checks if the given text line is a single line container.
   * @param lineOfText The text line to check.
   * @returns True if the text line is a single line container, otherwise false.
   */
  isSingleLineContainer: (lineOfText: vscode.TextLine) => {
    return (
      containerHelper.isStartOfContainer(lineOfText.text) &&
      containerHelper.isEndOfContainer(lineOfText.text)
    );
  },

  /**
   * Builds a multi-line container.
   * @param lineOfText The current line of text.
   * @param container The current container.
   * @param lineIndex The index of the current line.
   * @returns The updated container.
   */
  buildMultiLineContainer: (
    lineOfText: vscode.TextLine,
    container: CmsContainer,
    lineIndex: number
  ): CmsContainer => {
    if (containerHelper.isStartOfContainer(lineOfText.text)) {
      return {
        ...container,
        isBeingBuilt: true,
      };
    }

    if (containerHelper.isEndOfContainer(lineOfText.text)) {
      return {
        ...container,
        isComplete: true,
      };
    }

    if (!container.isBeingBuilt) {
      return container;
    }

    const newContainer = { ...container };

    // attribut line, eg: "typ:text;"
    // remove leading and trailing whitespace, remove ";"
    const attribute = lineOfText.text.replace(";", "").trim();

    // add attribut to newContainer, eg: type: text
    newContainer["attributes"].push({ attribute, lineIndex });

    // console.log("newContainer", newContainer);

    return newContainer;
  },

  /**
   * Builds a single line container.
   * @param lineOfText The current line of text.
   * @param container The current container.
   * @param lineIndex The index of the current line.
   * @returns The updated container.
   */
  buildSingleLineContainer: (
    lineOfText: vscode.TextLine,
    container: CmsContainer,
    lineIndex: number
  ): CmsContainer => {
    const newContainer = { ...container };

    // separate textline into array of attributes, trim and remove empty strings, split by ";" and filter
    const attributes = lineOfText.text
      .replace("[container]", "")
      .replace("[EOcontainer]", "")
      .trim()
      .split(";")
      .filter((attribut) => attribut);

    //attributs = ["type:text", "width:100", ...]
    // add attributes to newContainer, eg: type: text, width: 100, etc
    attributes.forEach((attribute) => {
      newContainer["attributes"].push({ attribute, lineIndex });
    });

    // set isComplete to true
    newContainer.isComplete = true;
    newContainer.isBeingBuilt = true;

    return newContainer;
  },

  /**
   * Builds a container.
   * @param lineOfText The current line of text.
   * @param container The current container.
   * @param lineIndex The index of the current line.
   * @returns The updated container.
   */
  buildContainer: (
    lineOfText: vscode.TextLine,
    container: CmsContainer,
    lineIndex: number
  ): CmsContainer => {
    if (lineOfText.isEmptyOrWhitespace) {
      return container;
    }

    if (containerHelper.isSingleLineContainer(lineOfText)) {
      return containerHelper.buildSingleLineContainer(
        lineOfText,
        container,
        lineIndex
      );
    } else {
      return containerHelper.buildMultiLineContainer(
        lineOfText,
        container,
        lineIndex
      );
    }
  },

  /**
   * Checks if the given container type matches the container diagnostic entry.
   * @param container The container to check.
   * @param containerDiagnostic The container diagnostic entry to check.
   * @returns True if the container type matches the container diagnostic entry, otherwise false.
   */
  isMatchingContainerType: (
    container: CmsContainer,
    containerDiagnostic: CmsDiagnosticEntry
  ): boolean => {
    // find the container type attribute
    // eg: "typ:text;"
    const containerTypeAttribute = container.attributes.find((attribute) =>
      attribute.attribute.startsWith("typ:")
    );

    // if the container has a type attribute
    if (containerTypeAttribute) {
      const containerHasEnumAttribute = container.attributes.find((attribute) =>
        attribute.attribute.startsWith("enum:")
      );

      const containerHasTextAttribute = container.attributes.find(
        (attribute) => attribute.attribute === "typ:text"
      );

      // get the container type
      const containerType =
        containerHasEnumAttribute && containerHasTextAttribute
          ? "enum"
          : containerTypeAttribute.attribute.split(":")[1];

      // check if the container type matches the diagnostic entry
      return containerType === containerDiagnostic.containerType;
    }

    return false;
  },

  /**
   * Resets the container.
   * @returns A new container object.
   */
  resetContainer: (): CmsContainer => {
    return {
      isBeingBuilt: false,
      isComplete: false,
      attributes: [],
    };
  },
};

export default containerHelper;
