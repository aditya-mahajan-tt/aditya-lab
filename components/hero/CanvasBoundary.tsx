"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches anything the 3D chunk throws — a refused context, a driver
 * failure, a shader that will not compile on some 2017 Android GPU — and
 * hands control back to the DOM core.
 *
 * It lives in `components/`, not `three/`, on purpose: a boundary inside the
 * dynamically-imported chunk cannot catch a failure of that chunk. This file
 * imports nothing from Three.js and ships in the initial bundle.
 */
type Props = {
  children: ReactNode;
  onError: (message: string) => void;
};

export class CanvasBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
